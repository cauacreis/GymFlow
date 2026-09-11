-- ==============================================================================
-- GYMFLOW — Migration: Subscription Tiers, Device Lockout & Payments Audit
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Adicionar colunas de gestão de assinatura na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending_choice' CHECK (subscription_status IN ('pending_choice', 'trial', 'active', 'past_due', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial_7d',
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'pro' CHECK (plan_tier IN ('basico', 'pro', 'vip')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- 2. Tabela de Registros de Dispositivos (Anti-Fraude e Limite de 1 Conta por Aparelho)
CREATE TABLE IF NOT EXISTS public.device_registrations (
  device_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registered_email TEXT,
  trial_used BOOLEAN NOT NULL DEFAULT FALSE,
  trial_used_at TIMESTAMPTZ,
  subscription_plan TEXT DEFAULT 'pending_choice',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Auditoria Financeira de Pagamentos (Mercado Pago Webhooks & Idempotência)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  plan_id TEXT NOT NULL,
  external_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_device_registrations_email ON public.device_registrations(registered_email);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 5. Políticas RLS Fortalecidas (Anti-Tampering)
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de dispositivos" ON public.device_registrations;
CREATE POLICY "Permitir leitura de dispositivos" ON public.device_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir registro de dispositivos" ON public.device_registrations;
CREATE POLICY "Permitir registro de dispositivos" ON public.device_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de dispositivos" ON public.device_registrations;
CREATE POLICY "Permitir atualizacao de dispositivos" ON public.device_registrations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir leitura de pagamentos do proprio usuario" ON public.payments;
CREATE POLICY "Permitir leitura de pagamentos do proprio usuario" ON public.payments 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Permitir insercao de pagamentos pelo webhook" ON public.payments;
DROP POLICY IF EXISTS "Permitir gerenciamento de pagamentos apenas pelo servidor" ON public.payments;
CREATE POLICY "Permitir gerenciamento de pagamentos apenas pelo servidor" ON public.payments 
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 6. Trigger Anti-Fraude: Proteção dos Campos de Assinatura no Perfil
-- Impede que usuários maliciosos autenticados alterem seu próprio subscription_status,
-- plan_tier ou datas de expiração diretamente via cliente Supabase (anon key).
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

DROP TRIGGER IF EXISTS trg_protect_profile_subscription ON public.profiles;
CREATE TRIGGER trg_protect_profile_subscription
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_subscription_fields();
