-- ==============================================================================
-- GYMFLOW — Migration: Subscription Cancellation & Feedback Flow
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Atualizar constraint de status de assinatura na tabela profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check 
  CHECK (subscription_status IN ('pending_choice', 'trial', 'active', 'past_due', 'expired', 'canceled'));

-- 2. Adicionar colunas de auditoria de cancelamento se não existirem
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_canceled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS cancel_feedback TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_subscription_id TEXT;

-- 3. Atualizar função de proteção de trigger para permitir cancelamento legítimo
CREATE OR REPLACE FUNCTION public.protect_profile_subscription_fields()
RETURNS TRIGGER AS $$
DECLARE
  jwt_role text;
BEGIN
  BEGIN
    jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  -- Se a alteração for feita via backend (service_role ou superusuário postgres), permite
  IF jwt_role = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  -- Permite que o próprio usuário cancele sua assinatura (status = 'canceled')
  -- preservando as datas de término (sem auto-concessão de dias adicionais)
  IF OLD.subscription_status IN ('active', 'trial') AND NEW.subscription_status = 'canceled' THEN
    -- Garante que o usuário não possa estender as datas de expiração ao cancelar
    NEW.subscription_ends_at := OLD.subscription_ends_at;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.plan_tier := OLD.plan_tier;
    RETURN NEW;
  END IF;

  -- Bloqueia qualquer tentativa do cliente anon/autenticado de auto-conceder plano ou status ativo
  IF (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) OR
     (OLD.plan_tier IS DISTINCT FROM NEW.plan_tier) OR
     (OLD.subscription_ends_at IS DISTINCT FROM NEW.subscription_ends_at) OR
     (OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at) OR
     (OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan) THEN
    NEW.subscription_status := OLD.subscription_status;
    NEW.plan_tier := OLD.plan_tier;
    NEW.subscription_ends_at := OLD.subscription_ends_at;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.subscription_plan := OLD.subscription_plan;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
