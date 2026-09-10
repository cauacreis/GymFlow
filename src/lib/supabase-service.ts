/**
 * Supabase Service Layer
 * Camada de comunicação com o Supabase com tratamento defensivo e fallback gracioso
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";
import { StudentProfile, CoachPlanOption, StudentWorkoutPackage } from "./workout-store";
import { BookingRequest, CoachTrainer, AppNotification } from "./booking-store";
import { UserProfile } from "./auth-store";

// ============================================================================
// ALUNOS (STUDENTS)
// ============================================================================

export async function fetchStudentsFromSupabase(coachId?: string): Promise<StudentProfile[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    let query = client.from("students").select("*");
    if (coachId) {
      query = query.eq("coach_id", coachId);
    }
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.warn("⚠️ [Supabase] Erro ao buscar alunos:", error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any): StudentProfile => ({
      id: row.id,
      name: row.name,
      email: row.email || "",
      phone: row.phone || undefined,
      matricula: row.matricula || `GF-${row.id.slice(0, 5)}`,
      goal: row.goal || "Hipertrofia",
      plan: row.plan || "Mensal Pro",
      status: row.status || "ativo",
      monthlyPresence: row.monthly_presence ?? 0,
      monthlyAbsences: row.monthly_absences ?? 0,
      monthlyDelays: row.monthly_delays ?? 0,
      totalClasses: row.total_classes ?? 0,
      lastPresence: row.last_presence || undefined,
      age: row.age ?? 25,
      hasWorkoutSheet: row.has_workout_sheet ?? true,
      isOfflineStudent: row.is_offline_student ?? false,
      emergencyContact: row.emergency_contact || undefined,
      avatarUrl: row.avatar_url || undefined,
      currentRoutineTitle: row.current_routine_title || "Acompanhamento Presencial Livre",
      prescribedBy: row.prescribed_by || "",
      prescribedAt: row.prescribed_at || "",
      notesFromCoach: row.notes_from_coach || undefined,
      scheduledTimeToday: row.scheduled_time_today || undefined,
      todayAttendanceStatus: row.today_attendance_status || undefined,
      delayMinutes: row.delay_minutes ?? 0,
    }));
  } catch (err) {
    console.warn("⚠️ [Supabase] Falha de rede ao buscar alunos:", err);
    return null;
  }
}

export async function upsertStudentToSupabase(student: StudentProfile, coachId: string = "coach_default"): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: student.id,
      coach_id: coachId,
      name: student.name,
      email: student.email || null,
      phone: student.phone || null,
      matricula: student.matricula,
      goal: student.goal,
      plan: student.plan,
      status: student.status || "ativo",
      monthly_presence: student.monthlyPresence ?? 0,
      monthly_absences: student.monthlyAbsences ?? 0,
      monthly_delays: student.monthlyDelays ?? 0,
      total_classes: student.totalClasses ?? 0,
      last_presence: student.lastPresence || null,
      age: student.age ?? 25,
      has_workout_sheet: student.hasWorkoutSheet ?? true,
      is_offline_student: student.isOfflineStudent ?? false,
      emergency_contact: student.emergencyContact || null,
      avatar_url: student.avatarUrl || null,
      current_routine_title: student.currentRoutineTitle || null,
      prescribed_by: student.prescribedBy || null,
      prescribed_at: student.prescribedAt || null,
      notes_from_coach: student.notesFromCoach || null,
      scheduled_time_today: student.scheduledTimeToday || null,
      today_attendance_status: student.todayAttendanceStatus || null,
      delay_minutes: student.delayMinutes ?? 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("students").upsert(payload, { onConflict: "id" });
    if (error) {
      console.warn("⚠️ [Supabase] Erro ao salvar aluno:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("⚠️ [Supabase] Falha ao upsert student:", err);
    return false;
  }
}

export async function deleteStudentFromSupabase(studentId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from("students").delete().eq("id", studentId);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// FICHAS DE TREINO (STUDENT WORKOUTS)
// ============================================================================

export async function fetchWorkoutFromSupabase(studentId: string): Promise<StudentWorkoutPackage | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("student_workouts")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      studentId: data.student_id,
      routineTitle: data.routine_title,
      prescribedBy: data.prescribed_by || "",
      prescribedAt: data.prescribed_at || "",
      coachNotes: data.coach_notes || undefined,
      splits: (data.splits as any) || [],
    };
  } catch {
    return null;
  }
}

export async function saveWorkoutToSupabase(workout: StudentWorkoutPackage): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      student_id: workout.studentId,
      routine_title: workout.routineTitle,
      prescribed_by: workout.prescribedBy,
      prescribed_at: workout.prescribedAt,
      coach_notes: workout.coachNotes || null,
      splits: workout.splits,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("student_workouts").upsert(payload, { onConflict: "student_id" });
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// AGENDAMENTOS (BOOKINGS)
// ============================================================================

export async function fetchBookingsFromSupabase(coachId?: string, studentId?: string): Promise<BookingRequest[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    let query = client.from("bookings").select("*");
    if (coachId) query = query.eq("coach_id", coachId);
    if (studentId) query = query.eq("student_id", studentId);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error || !data) return null;

    return data.map((b: any): BookingRequest => ({
      id: b.id,
      studentId: b.student_id,
      studentName: b.student_name,
      studentPhone: b.student_phone || "",
      coachId: b.coach_id,
      coachName: b.coach_name,
      coachPhone: b.coach_phone || "",
      slotDay: b.slot_day,
      slotTime: b.slot_time,
      planType: b.plan_type,
      basePrice: Number(b.base_price),
      extraOfferedAmount: Number(b.extra_offered_amount || 0),
      totalPrice: Number(b.total_price),
      status: b.status,
      paymentStatus: b.payment_status,
      attendanceStatus: b.attendance_status,
      notes: b.notes || undefined,
      createdAt: b.created_at,
      rescheduleRequest: b.reschedule_request || undefined,
    }));
  } catch {
    return null;
  }
}

export async function saveBookingToSupabase(booking: BookingRequest): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: booking.id,
      student_id: booking.studentId,
      student_name: booking.studentName,
      student_phone: booking.studentPhone || null,
      coach_id: booking.coachId,
      coach_name: booking.coachName,
      coach_phone: booking.coachPhone || null,
      slot_day: booking.slotDay,
      slot_time: booking.slotTime,
      plan_type: booking.planType,
      base_price: booking.basePrice,
      extra_offered_amount: booking.extraOfferedAmount || 0,
      total_price: booking.totalPrice,
      status: booking.status,
      payment_status: booking.paymentStatus,
      attendance_status: booking.attendanceStatus,
      notes: booking.notes || null,
      reschedule_request: booking.rescheduleRequest || null,
      created_at: booking.createdAt,
    };

    const { error } = await client.from("bookings").upsert(payload, { onConflict: "id" });
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// PLANOS DO PROFESSOR (COACH PLANS)
// ============================================================================

export async function fetchCoachPlansFromSupabase(coachId: string = "coach_default"): Promise<CoachPlanOption[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("coach_plans")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: true });

    if (error || !data) return null;

    return data.map((p: any): CoachPlanOption => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      period: p.period,
      frequency: p.frequency || undefined,
      description: p.description || undefined,
      isCustom: p.is_custom,
    }));
  } catch {
    return null;
  }
}

export async function saveCoachPlanToSupabase(plan: CoachPlanOption, coachId: string = "coach_default"): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: plan.id,
      coach_id: coachId,
      name: plan.name,
      price: plan.price,
      period: plan.period || "mensal",
      frequency: plan.frequency || null,
      description: plan.description || null,
      is_custom: Boolean(plan.isCustom),
    };

    const { error } = await client.from("coach_plans").upsert(payload, { onConflict: "id" });
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// PERFIL DO USUÁRIO (USER PROFILE)
// ============================================================================

export async function saveProfileToSupabase(user: UserProfile): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    // Se for id sintético temporário (ex: user_12345), não força chave UUID se o usuário não logou via Supabase Auth
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (!isUUID) return false;

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      active_role: user.activeRole,
      enabled_roles: user.enabledRoles,
      matricula: user.matricula || null,
      goal: user.goal || null,
      cref: user.cref || null,
      specialty: user.specialty || null,
      bio: user.bio || null,
      hourly_rate: user.hourlyRate ?? 35,
      avatar_url: user.avatarUrl || null,
      instagram: user.instagram || null,
      location: user.location || null,
      pricing: user.pricing || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("profiles").upsert(payload, { onConflict: "id" });
    return !error;
  } catch {
    return false;
  }
}
