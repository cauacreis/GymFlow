-- ==============================================================================
-- GYMFLOW — Migration: Production Scale Multi-Tenant RLS Hardening
-- Endurecimento de Políticas de Segurança em Nível de Linha (RLS)
-- Garante isolamento estrito de inquilino (CWE-284 / OWASP Top 10 A01:2021)
-- ==============================================================================

-- 1. PROFILES: Apenas o próprio usuário autenticado pode alterar seus dados cadastrais
DROP POLICY IF EXISTS "Permitir modificação do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserção do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir exclusão do próprio perfil" ON public.profiles;

CREATE POLICY "Permitir inserção do próprio perfil" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Permitir atualização do próprio perfil" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Permitir exclusão do próprio perfil" ON public.profiles
  FOR DELETE
  USING (auth.uid() = id OR auth.role() = 'service_role');

-- 2. STUDENTS: Apenas o treinador responsável ou o próprio aluno vinculado pode acessar
DROP POLICY IF EXISTS "Permitir acesso aos alunos" ON public.students;
DROP POLICY IF EXISTS "Permitir leitura de alunos autorizados" ON public.students;
DROP POLICY IF EXISTS "Permitir gerenciamento de alunos pelo treinador" ON public.students;

CREATE POLICY "Permitir leitura de alunos autorizados" ON public.students
  FOR SELECT
  USING (
    coach_id = auth.uid()::text OR
    user_id = auth.uid() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Permitir gerenciamento de alunos pelo treinador" ON public.students
  FOR ALL
  USING (
    coach_id = auth.uid()::text OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    coach_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

-- 3. COACH PLANS: Catálogo público para leitura, mas escrita restrita ao respectivo professor
DROP POLICY IF EXISTS "Permitir acesso aos planos do professor" ON public.coach_plans;
DROP POLICY IF EXISTS "Permitir leitura pública de planos de treinadores" ON public.coach_plans;
DROP POLICY IF EXISTS "Permitir gestão de planos apenas pelo treinador" ON public.coach_plans;

CREATE POLICY "Permitir leitura pública de planos de treinadores" ON public.coach_plans
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir gestão de planos apenas pelo treinador" ON public.coach_plans
  FOR ALL
  USING (
    coach_id = auth.uid()::text OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    coach_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

-- 4. STUDENT WORKOUTS: Fichas de treino acessíveis apenas pelo aluno e seu treinador
DROP POLICY IF EXISTS "Permitir acesso às fichas de treino" ON public.student_workouts;
DROP POLICY IF EXISTS "Permitir leitura da ficha pelo aluno ou professor" ON public.student_workouts;
DROP POLICY IF EXISTS "Permitir prescrição de treino pelo treinador" ON public.student_workouts;

CREATE POLICY "Permitir leitura da ficha pelo aluno ou professor" ON public.student_workouts
  FOR SELECT
  USING (
    student_id = auth.uid()::text OR
    prescribed_by = auth.uid()::text OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Permitir prescrição de treino pelo treinador" ON public.student_workouts
  FOR ALL
  USING (
    prescribed_by = auth.uid()::text OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    prescribed_by = auth.uid()::text OR
    auth.role() = 'service_role'
  );

-- 5. BOOKINGS: Agendamentos visíveis e gerenciáveis apenas pelas duas partes da sessão
DROP POLICY IF EXISTS "Permitir acesso aos agendamentos" ON public.bookings;
DROP POLICY IF EXISTS "Permitir leitura de agendamentos das partes" ON public.bookings;
DROP POLICY IF EXISTS "Permitir gestão de agendamentos autorizados" ON public.bookings;

CREATE POLICY "Permitir leitura de agendamentos das partes" ON public.bookings
  FOR SELECT
  USING (
    student_id = auth.uid()::text OR
    coach_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Permitir gestão de agendamentos autorizados" ON public.bookings
  FOR ALL
  USING (
    student_id = auth.uid()::text OR
    coach_id = auth.uid()::text OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    student_id = auth.uid()::text OR
    coach_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

-- 6. NOTIFICATIONS: Notificações direcionadas estritamente ao destinatário
DROP POLICY IF EXISTS "Permitir acesso às notificações" ON public.notifications;
DROP POLICY IF EXISTS "Permitir acesso a notificações próprias" ON public.notifications;

CREATE POLICY "Permitir acesso a notificações próprias" ON public.notifications
  FOR ALL
  USING (
    student_id = auth.uid()::text OR
    coach_id = auth.uid()::text OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    student_id = auth.uid()::text OR
    coach_id = auth.uid()::text OR
    auth.role() = 'service_role'
  );

-- 7. ÍNDICES COMPOSTOS PARA CONSULTAS DE ALTA ESCALA
CREATE INDEX IF NOT EXISTS idx_students_coach_status ON public.students(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_coach_slot ON public.bookings(coach_id, slot_day);
CREATE INDEX IF NOT EXISTS idx_bookings_student_slot ON public.bookings(student_id, slot_day);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(student_id, coach_id, read);
