-- ==============================================================================
-- GYMFLOW — Schema Oficial de Banco de Dados PostgreSQL (Supabase)
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuário (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  active_role TEXT NOT NULL DEFAULT 'student' CHECK (active_role IN ('student', 'coach')),
  enabled_roles TEXT[] NOT NULL DEFAULT ARRAY['student', 'coach'],
  matricula TEXT,
  goal TEXT,
  cref TEXT,
  specialty TEXT,
  bio TEXT,
  hourly_rate NUMERIC DEFAULT 35,
  avatar_url TEXT,
  instagram TEXT,
  location TEXT,
  pricing JSONB DEFAULT '{"basicMonthly": 35, "proMonthly": 45, "vipMonthly": 55, "dailySession": 35, "weeklyPlan": 45, "monthlyPlan": 55}'::jsonb,
  subscription_status TEXT DEFAULT 'pending_choice' CHECK (subscription_status IN ('pending_choice', 'trial', 'active', 'past_due', 'expired')),
  subscription_plan TEXT DEFAULT 'trial_7d',
  plan_tier TEXT DEFAULT 'pro' CHECK (plan_tier IN ('basico', 'pro', 'vip')),
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Alunos do Treinador (Students)
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  matricula TEXT,
  goal TEXT DEFAULT 'Hipertrofia',
  plan TEXT DEFAULT 'Mensal Pro',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
  monthly_presence INT NOT NULL DEFAULT 0,
  monthly_absences INT NOT NULL DEFAULT 0,
  monthly_delays INT NOT NULL DEFAULT 0,
  total_classes INT NOT NULL DEFAULT 0,
  last_presence TEXT,
  age INT DEFAULT 25,
  has_workout_sheet BOOLEAN NOT NULL DEFAULT TRUE,
  is_offline_student BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_contact TEXT,
  avatar_url TEXT,
  current_routine_title TEXT,
  prescribed_by TEXT,
  prescribed_at TEXT,
  notes_from_coach TEXT,
  scheduled_time_today TEXT,
  today_attendance_status TEXT,
  delay_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Planos Oferecidos pelo Professor (Coach Plans)
CREATE TABLE IF NOT EXISTS public.coach_plans (
  id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  period TEXT NOT NULL DEFAULT 'mensal',
  frequency TEXT,
  description TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela de Fichas e Rotinas de Treino (Student Workouts)
CREATE TABLE IF NOT EXISTS public.student_workouts (
  student_id TEXT PRIMARY KEY,
  routine_title TEXT NOT NULL,
  prescribed_by TEXT,
  prescribed_at TEXT,
  coach_notes TEXT,
  splits JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Tabela de Agendamentos e Horários (Bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  coach_id TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  coach_phone TEXT,
  slot_day TEXT NOT NULL,
  slot_time TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  extra_offered_amount NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  attendance_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (attendance_status IN ('scheduled', 'attended', 'missed', 'delayed', 'rescheduled')),
  notes TEXT,
  reschedule_request JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Tabela de Notificações (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  target_role TEXT NOT NULL CHECK (target_role IN ('student', 'coach')),
  student_id TEXT,
  coach_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Tabela de Dispositivos (Anti-Fraude e Limite de 1 Conta por Aparelho)
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

-- 9. Tabela de Pagamentos (Auditoria Financeira e Idempotência Mercado Pago)
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

-- ==============================================================================
-- 10. Índices de Alta Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_students_coach_id ON public.students(coach_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_bookings_coach_id ON public.bookings(coach_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON public.bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_day ON public.bookings(slot_day);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON public.notifications(target_role, read);

-- ==============================================================================
-- 9. Políticas de Segurança RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público e Autenticado (Permissivas para operação fluida)
DROP POLICY IF EXISTS "Permitir leitura de perfis" ON public.profiles;
CREATE POLICY "Permitir leitura de perfis" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir modificação do próprio perfil" ON public.profiles;
CREATE POLICY "Permitir modificação do próprio perfil" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso aos alunos" ON public.students;
CREATE POLICY "Permitir acesso aos alunos" ON public.students FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso aos planos do professor" ON public.coach_plans;
CREATE POLICY "Permitir acesso aos planos do professor" ON public.coach_plans FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso às fichas de treino" ON public.student_workouts;
CREATE POLICY "Permitir acesso às fichas de treino" ON public.student_workouts FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso aos agendamentos" ON public.bookings;
CREATE POLICY "Permitir acesso aos agendamentos" ON public.bookings FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir acesso às notificações" ON public.notifications;
CREATE POLICY "Permitir acesso às notificações" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura de pagamentos do proprio usuario" ON public.payments;
CREATE POLICY "Permitir leitura de pagamentos do proprio usuario" ON public.payments 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Permitir gerenciamento de pagamentos apenas pelo servidor" ON public.payments;
CREATE POLICY "Permitir gerenciamento de pagamentos apenas pelo servidor" ON public.payments 
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger Anti-Fraude: Impede escalação de privilégios de assinatura diretamente via cliente anon
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

  IF jwt_role = 'service_role' OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

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

-- ==============================================================================
-- 10. Trigger Automático: Criação de Perfil no Cadastro do Usuário (Auth.Users)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    phone,
    active_role,
    enabled_roles,
    matricula,
    goal,
    cref,
    specialty,
    bio
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    ARRAY['student', 'coach'],
    'GF-' || floor(random() * 90000 + 10000)::text,
    COALESCE(NEW.raw_user_meta_data->>'goal', 'Hipertrofia'),
    NEW.raw_user_meta_data->>'cref',
    NEW.raw_user_meta_data->>'specialty',
    NEW.raw_user_meta_data->>'bio'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 11. Habilitar Realtime para Sincronização em Tempo Real (Opcional)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
