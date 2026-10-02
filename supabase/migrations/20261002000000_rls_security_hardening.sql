-- ==============================================================================
-- GYMFLOW — Migração de Hardening de Segurança RLS (Row Level Security)
-- Data: 02/10/2026
-- Objetivo:
-- 1. Eliminar qualquer política permissiva insegura (ex: OR true).
-- 2. Garantir isolamento estrito de inquilino (Multi-Tenant) em todas as tabelas.
-- 3. Proteger histórico de treinos, cárdio, bioimpedância, pedidos e conquistas.
-- ==============================================================================

-- 1. Medições Corporais & Bioimpedância (body_metrics)
ALTER TABLE IF EXISTS public.body_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de medições pelo dono ou personal" ON public.body_metrics;
DROP POLICY IF EXISTS "Permitir gestão de medições pelo dono" ON public.body_metrics;
DROP POLICY IF EXISTS "body_metrics_select_owner_or_coach" ON public.body_metrics;
DROP POLICY IF EXISTS "body_metrics_all_owner" ON public.body_metrics;

CREATE POLICY "body_metrics_select_owner_or_coach" ON public.body_metrics
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.user_id = public.body_metrics.user_id AND s.coach_id = auth.uid()::text
    )
  );

CREATE POLICY "body_metrics_all_owner" ON public.body_metrics
  FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- 2. Histórico de Treinos Cárdio (cardio_sessions)
ALTER TABLE IF EXISTS public.cardio_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de cardio pelo dono ou personal" ON public.cardio_sessions;
DROP POLICY IF EXISTS "Permitir gestão de cardio pelo dono" ON public.cardio_sessions;
DROP POLICY IF EXISTS "cardio_sessions_select_owner" ON public.cardio_sessions;
DROP POLICY IF EXISTS "cardio_sessions_all_owner" ON public.cardio_sessions;

CREATE POLICY "cardio_sessions_select_owner" ON public.cardio_sessions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = public.cardio_sessions.student_id AND s.coach_id = auth.uid()::text
    )
  );

CREATE POLICY "cardio_sessions_all_owner" ON public.cardio_sessions
  FOR ALL
  USING (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

-- 3. Gamificação e Conquistas (user_achievements)
ALTER TABLE IF EXISTS public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de conquistas pelo dono" ON public.user_achievements;
DROP POLICY IF EXISTS "Permitir gestão de conquistas pelo dono" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_select" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_all_owner" ON public.user_achievements;

CREATE POLICY "user_achievements_select" ON public.user_achievements
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

CREATE POLICY "user_achievements_all_owner" ON public.user_achievements
  FOR ALL
  USING (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

-- 4. Biblioteca de Rotinas Modelo do Treinador (coach_routine_templates)
ALTER TABLE IF EXISTS public.coach_routine_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de rotinas de treinadores" ON public.coach_routine_templates;
DROP POLICY IF EXISTS "Permitir gestão de rotinas pelo treinador" ON public.coach_routine_templates;
DROP POLICY IF EXISTS "coach_templates_select" ON public.coach_routine_templates;
DROP POLICY IF EXISTS "coach_templates_manage_owner" ON public.coach_routine_templates;

CREATE POLICY "coach_templates_select" ON public.coach_routine_templates
  FOR SELECT
  USING (true);

CREATE POLICY "coach_templates_manage_owner" ON public.coach_routine_templates
  FOR ALL
  USING (
    coach_id = auth.uid()::text OR
    user_id = auth.uid() OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    coach_id = auth.uid()::text OR
    user_id = auth.uid() OR
    auth.role() = 'service_role'
  );

-- 5. Logs de Acesso e Catraca (access_logs)
ALTER TABLE IF EXISTS public.access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de logs de acesso pelo usuario" ON public.access_logs;
DROP POLICY IF EXISTS "Permitir inserção de checkin" ON public.access_logs;
DROP POLICY IF EXISTS "access_logs_select_owner" ON public.access_logs;
DROP POLICY IF EXISTS "access_logs_insert_owner" ON public.access_logs;

CREATE POLICY "access_logs_select_owner" ON public.access_logs
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

CREATE POLICY "access_logs_insert_owner" ON public.access_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

-- 6. Lotação da Academia (gym_occupancy)
ALTER TABLE IF EXISTS public.gym_occupancy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura publica da lotacao" ON public.gym_occupancy;
DROP POLICY IF EXISTS "gym_occupancy_select_public" ON public.gym_occupancy;
DROP POLICY IF EXISTS "gym_occupancy_manage_admin" ON public.gym_occupancy;

CREATE POLICY "gym_occupancy_select_public" ON public.gym_occupancy
  FOR SELECT
  USING (true);

CREATE POLICY "gym_occupancy_manage_admin" ON public.gym_occupancy
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7. Histórico de Aulas On-Demand (user_class_history)
ALTER TABLE IF EXISTS public.user_class_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de historico de aulas pelo aluno" ON public.user_class_history;
DROP POLICY IF EXISTS "Permitir gestao de historico de aulas pelo aluno" ON public.user_class_history;
DROP POLICY IF EXISTS "user_class_history_select_owner" ON public.user_class_history;
DROP POLICY IF EXISTS "user_class_history_manage_owner" ON public.user_class_history;

CREATE POLICY "user_class_history_select_owner" ON public.user_class_history
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

CREATE POLICY "user_class_history_manage_owner" ON public.user_class_history
  FOR ALL
  USING (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

-- 8. Avaliações e Prova Social (reviews)
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura publica de avaliacoes" ON public.reviews;
DROP POLICY IF EXISTS "Permitir envio de avaliacao por usuario" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.reviews;
DROP POLICY IF EXISTS "reviews_manage_owner" ON public.reviews;

CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY "reviews_insert_authenticated" ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "reviews_manage_owner" ON public.reviews
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

-- 9. Pedidos & Nutrição Fit (orders)
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de pedidos pelo cliente" ON public.orders;
DROP POLICY IF EXISTS "Permitir gestao de pedidos pelo cliente" ON public.orders;
DROP POLICY IF EXISTS "orders_select_owner" ON public.orders;
DROP POLICY IF EXISTS "orders_manage_owner" ON public.orders;

CREATE POLICY "orders_select_owner" ON public.orders
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

CREATE POLICY "orders_manage_owner" ON public.orders
  FOR ALL
  USING (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id OR
    student_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );
