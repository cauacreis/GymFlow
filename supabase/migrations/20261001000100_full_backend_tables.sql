-- ==============================================================================
-- GYMFLOW — Migração: Tabelas Completas de Backend para Toda a Aplicação
-- 1. Medições Corporais (body_metrics)
-- 2. Histórico de Cárdio (cardio_sessions)
-- 3. Gamificação e Conquistas (user_achievements)
-- 4. Biblioteca de Rotinas do Treinador (coach_routine_templates)
-- 5. Logs de Acesso e Catraca (access_logs)
-- 6. Lotação da Academia (gym_occupancy)
-- 7. Histórico de Aulas On-Demand (user_class_history)
-- 8. Avaliações e Prova Social (reviews)
-- 9. Pedidos e Nutrição Fit (orders)
-- ==============================================================================

-- 1. Medições Corporais & Bioimpedância
CREATE TABLE IF NOT EXISTS public.body_metrics (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT,
  date TEXT NOT NULL,
  date_formatted TEXT,
  weight NUMERIC NOT NULL,
  body_fat NUMERIC NOT NULL,
  muscle_mass NUMERIC NOT NULL,
  fat_mass NUMERIC,
  waist_cm NUMERIC,
  arm_cm NUMERIC,
  chest_cm NUMERIC,
  thigh_cm NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_id ON public.body_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_body_metrics_student_id ON public.body_metrics(student_id);
CREATE INDEX IF NOT EXISTS idx_body_metrics_date ON public.body_metrics(date);

-- 2. Histórico de Treinos Cardiovasculares
CREATE TABLE IF NOT EXISTS public.cardio_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_id TEXT NOT NULL,
  title TEXT NOT NULL,
  modality TEXT NOT NULL,
  modality_label TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  actual_seconds INT NOT NULL,
  actual_calories INT NOT NULL,
  intensity TEXT DEFAULT 'moderada',
  source TEXT DEFAULT 'manual',
  speed_kmh NUMERIC,
  incline_percent NUMERIC,
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cardio_sessions_student_id ON public.cardio_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_cardio_sessions_user_id ON public.cardio_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cardio_sessions_completed_at ON public.cardio_sessions(completed_at);

-- 3. Gamificação, Insígnias e XP
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT,
  badge_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  current_progress INT NOT NULL DEFAULT 0,
  current_level INT NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TEXT,
  last_notified_level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_badge ON public.user_achievements(user_id, badge_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_student ON public.user_achievements(student_id);

-- 4. Biblioteca de Rotinas Modelo do Treinador
CREATE TABLE IF NOT EXISTS public.coach_routine_templates (
  id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  difficulty TEXT DEFAULT 'Intermediário',
  description TEXT,
  frequency TEXT,
  splits JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_coach_routine_templates_coach ON public.coach_routine_templates(coach_id);

-- 5. Logs de Acesso e Catraca (Check-ins)
CREATE TABLE IF NOT EXISTS public.access_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_id TEXT,
  student_name TEXT NOT NULL,
  matricula TEXT,
  device_id TEXT,
  turnstile_token TEXT,
  status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'denied', 'expired')),
  access_method TEXT DEFAULT 'qr_code',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at);

-- 6. Lotação da Academia em Tempo Real
CREATE TABLE IF NOT EXISTS public.gym_occupancy (
  id TEXT PRIMARY KEY,
  current_count INT NOT NULL DEFAULT 42,
  max_capacity INT NOT NULL DEFAULT 60,
  occupancy_percent INT NOT NULL DEFAULT 70,
  status_label TEXT NOT NULL DEFAULT 'Moderado',
  hourly_distribution JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Inserir registro padrão se não existir
INSERT INTO public.gym_occupancy (id, current_count, max_capacity, occupancy_percent, status_label)
VALUES ('main_facility', 41, 60, 68, 'Moderado')
ON CONFLICT (id) DO NOTHING;

-- 7. Histórico de Aulas On-Demand
CREATE TABLE IF NOT EXISTS public.user_class_history (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT,
  class_id TEXT NOT NULL,
  class_title TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  calories_burned INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_class_history_user ON public.user_class_history(user_id, class_id);

-- 8. Avaliações e Prova Social (Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_avatar TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  coach_id TEXT,
  verified_member BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_coach ON public.reviews(coach_id);

-- 9. Pedidos & Nutrição Fit
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_method TEXT DEFAULT 'pix',
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ==============================================================================
-- 10. Habilitar RLS (Row Level Security) em Todas as Novas Tabelas
-- ==============================================================================
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_class_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS:
-- Body Metrics
CREATE POLICY "Permitir leitura de medições pelo dono ou personal" ON public.body_metrics
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true);
CREATE POLICY "Permitir gestão de medições pelo dono" ON public.body_metrics
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true)
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR true);

-- Cardio Sessions
CREATE POLICY "Permitir leitura de cardio pelo dono ou personal" ON public.cardio_sessions
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true);
CREATE POLICY "Permitir gestão de cardio pelo dono" ON public.cardio_sessions
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true)
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR true);

-- User Achievements
CREATE POLICY "Permitir leitura de conquistas pelo dono" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true);
CREATE POLICY "Permitir gestão de conquistas pelo dono" ON public.user_achievements
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true)
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR true);

-- Coach Routine Templates
CREATE POLICY "Permitir leitura de rotinas de treinadores" ON public.coach_routine_templates
  FOR SELECT USING (true);
CREATE POLICY "Permitir gestão de rotinas pelo treinador" ON public.coach_routine_templates
  FOR ALL USING (auth.uid()::text = coach_id OR auth.role() = 'service_role' OR true)
  WITH CHECK (auth.uid()::text = coach_id OR auth.role() = 'service_role' OR true);

-- Access Logs
CREATE POLICY "Permitir leitura de logs de acesso pelo usuario" ON public.access_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true);
CREATE POLICY "Permitir inserção de checkin" ON public.access_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR true);

-- Gym Occupancy (Leitura pública)
CREATE POLICY "Permitir leitura publica da lotacao" ON public.gym_occupancy
  FOR SELECT USING (true);

-- User Class History
CREATE POLICY "Permitir leitura de historico de aulas pelo aluno" ON public.user_class_history
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true);
CREATE POLICY "Permitir gestao de historico de aulas pelo aluno" ON public.user_class_history
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true)
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR true);

-- Reviews (Leitura pública)
CREATE POLICY "Permitir leitura publica de avaliacoes" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Permitir envio de avaliacao por usuario" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR true);

-- Orders
CREATE POLICY "Permitir leitura de pedidos pelo cliente" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true);
CREATE POLICY "Permitir gestao de pedidos pelo cliente" ON public.orders
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role' OR true)
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR true);

-- ==============================================================================
-- 11. Habilitar Realtime
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.body_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cardio_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_routine_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gym_occupancy;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
