-- ==============================================================================
-- GYMFLOW — Migration: Enterprise Idempotency, Webhook Ledger & FSM Integrity
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Tabela de Chaves de Idempotência (IETF Idempotency-Key Standard)
-- Evita requisições duplicadas (double-click / network retry) e concorrência in-flight.
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  route TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  response_status INT,
  response_body JSONB,
  resource_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + interval '24 hours')
);

-- Índices para buscas rápidas e purga de chaves expiradas
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON public.idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON public.idempotency_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_route ON public.idempotency_keys(route);

-- 2. Tabela de Ledger de Eventos de Webhook (Event Store & Deduplicação Estrita)
-- Previne reprocessamento de webhooks retransmitidos e garante idempotência do ledger.
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  event_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
  idempotency_key TEXT,
  payload JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_resource ON public.webhook_events(resource_id, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON public.webhook_events(created_at);

-- 3. Atualização na Tabela de Pagamentos para Suporte a FSM e Crédito Determinístico
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS credit_applied BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_credit_applied ON public.payments(credit_applied);

-- 4. Políticas de Segurança RLS (Row Level Security)
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Idempotency Keys gerenciado EXCLUSIVAMENTE pelo backend com service_role
DROP POLICY IF EXISTS "Permitir gerenciamento de idempotency apenas pelo servidor" ON public.idempotency_keys;
CREATE POLICY "Permitir gerenciamento de idempotency apenas pelo servidor" ON public.idempotency_keys
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Webhook Events gerenciado EXCLUSIVAMENTE pelo backend com service_role
DROP POLICY IF EXISTS "Permitir gerenciamento de webhooks apenas pelo servidor" ON public.webhook_events;
CREATE POLICY "Permitir gerenciamento de webhooks apenas pelo servidor" ON public.webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Função Utilitária para Limpeza Periódica de Chaves Expiradas
CREATE OR REPLACE FUNCTION public.clean_expired_idempotency_keys()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE expires_at < timezone('utc'::text, now());
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
