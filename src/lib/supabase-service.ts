/**
 * Supabase Service Layer
 * Camada de comunicação com o Supabase com tratamento defensivo e fallback gracioso
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";
import { StudentProfile, CoachPlanOption, StudentWorkoutPackage } from "./workout-store";
import { BookingRequest, CoachTrainer, AppNotification } from "./booking-store";
import { UserProfile } from "./auth-store";
import { isValidCoordinate } from "./geo";

// ============================================================================
// ALTA PERFORMANCE: CACHE EM MEMÓRIA & DEDUPLICAÇÃO DE REQUISIÇÕES IN-FLIGHT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  if (memoryCache.size >= 500) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateSupabaseCache(prefixOrKey?: string): void {
  if (!prefixOrKey) {
    memoryCache.clear();
    return;
  }
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(prefixOrKey) || k === prefixOrKey) {
      memoryCache.delete(k);
    }
  }
}

async function deduplicatedFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 30000): Promise<T> {
  const cached = getCached<T>(key, ttlMs);
  if (cached !== null) {
    return cached;
  }

  const existingInFlight = inFlightRequests.get(key);
  if (existingInFlight) {
    return existingInFlight as Promise<T>;
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      if (result !== null && result !== undefined) {
        setCache(key, result);
      }
      return result;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

// ============================================================================
// ALUNOS (STUDENTS)
// ============================================================================

export async function fetchStudentsFromSupabase(coachId?: string, limit: number = 100): Promise<StudentProfile[] | null> {
  const client = getSupabase();
  if (!client) return null;

  let targetCoachId = coachId;
  if (!targetCoachId) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) targetCoachId = session.user.id;
    } catch {}
  }

  // Se não houver coachId identificado, não executa query aberta para evitar vazamento multi-tenant
  if (!targetCoachId) {
    return [];
  }

  const cacheKey = `students_${targetCoachId}_${limit}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      const safeLimit = Math.min(Math.max(1, limit), 250);
      const { data, error } = await client
        .from("students")
        .select("*")
        .eq("coach_id", targetCoachId)
        .order("created_at", { ascending: false })
        .limit(safeLimit);

      if (error) {
        console.warn("⚠️ [Supabase] Erro ao buscar alunos:", error.message);
        return null;
      }

      if (!data) return [];

      return data.map((row: any): StudentProfile => ({
        id: row.id,
        coachId: row.coach_id,
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
  }, 20000); // 20s TTL
}

export async function upsertStudentToSupabase(student: StudentProfile, coachId?: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const targetCoachId = coachId || student.coachId || "coach_default";

  try {
    const payload = {
      id: student.id,
      coach_id: targetCoachId,
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
    invalidateSupabaseCache("students_");
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
    if (!error) {
      invalidateSupabaseCache("students_");
    }
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

  const cacheKey = `workout_${studentId}`;

  return deduplicatedFetch(cacheKey, async () => {
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
  }, 30000); // 30s TTL
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
    if (!error) {
      invalidateSupabaseCache(`workout_${workout.studentId}`);
    }
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// AGENDAMENTOS (BOOKINGS)
// ============================================================================

export async function fetchBookingsFromSupabase(coachId?: string, studentId?: string, limit: number = 100): Promise<BookingRequest[] | null> {
  const client = getSupabase();
  if (!client) return null;

  let targetCoachId = coachId;
  let targetStudentId = studentId;

  if (!targetCoachId && !targetStudentId) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) {
        targetStudentId = session.user.id;
      }
    } catch {}
  }

  // Previne queries globais sem isolamento de inquilino
  if (!targetCoachId && !targetStudentId) {
    return [];
  }

  const cacheKey = `bookings_${targetCoachId || "none"}_${targetStudentId || "none"}_${limit}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      let query = client.from("bookings").select("*");
      if (targetCoachId && targetStudentId) {
        query = query.or(`coach_id.eq.${targetCoachId},student_id.eq.${targetStudentId}`);
      } else if (targetCoachId) {
        query = query.eq("coach_id", targetCoachId);
      } else if (targetStudentId) {
        query = query.eq("student_id", targetStudentId);
      }

      const safeLimit = Math.min(Math.max(1, limit), 250);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(safeLimit);
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
  }, 15000); // 15s TTL
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
    if (!error) {
      invalidateSupabaseCache("bookings_");
    }
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// PLANOS DO PROFESSOR (COACH PLANS)
// ============================================================================

export async function fetchCoachPlansFromSupabase(coachId?: string): Promise<CoachPlanOption[] | null> {
  const client = getSupabase();
  if (!client) return null;

  let targetCoachId = coachId;
  if (!targetCoachId) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) targetCoachId = session.user.id;
    } catch {}
  }
  if (!targetCoachId) targetCoachId = "coach_default";

  const cacheKey = `coach_plans_${targetCoachId}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      const { data, error } = await client
        .from("coach_plans")
        .select("*")
        .eq("coach_id", targetCoachId)
        .order("created_at", { ascending: true });

      if (error || !data) return null;

      return data.map((p: any): CoachPlanOption => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        period: p.period,
        frequency: p.frequency || undefined,
        duration: p.duration || undefined,
        modalities: Array.isArray(p.modalities)
          ? p.modalities
          : typeof p.modalities === "string"
          ? (p.modalities.startsWith("[") ? JSON.parse(p.modalities) : p.modalities.split(",").map((s: string) => s.trim()))
          : undefined,
        description: p.description || undefined,
        isCustom: p.is_custom,
      }));
    } catch {
      return null;
    }
  }, 60000); // 60s TTL
}

export async function saveCoachPlanToSupabase(plan: CoachPlanOption, coachId?: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  let targetCoachId = coachId;
  if (!targetCoachId) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) targetCoachId = session.user.id;
    } catch {}
  }
  if (!targetCoachId) targetCoachId = "coach_default";

  try {
    const payload = {
      id: plan.id,
      coach_id: targetCoachId,
      name: plan.name,
      price: plan.price,
      period: plan.period || "mensal",
      frequency: plan.frequency || null,
      duration: plan.duration || null,
      modalities: plan.modalities || null,
      description: plan.description || null,
      is_custom: Boolean(plan.isCustom),
    };

    const { error } = await client.from("coach_plans").upsert(payload, { onConflict: "id" });
    if (!error) {
      invalidateSupabaseCache(`coach_plans_${coachId}`);
    }
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
    // Se for id sintético temporário (ex: user_12345), tenta recuperar o UUID da sessão ativa do Supabase Auth
    let targetId = user.id;
    let isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    if (!isUUID) {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.user.id)) {
          targetId = session.user.id;
          isUUID = true;
        }
      } catch {}
    }
    if (!isUUID) return false;

    const basePayload: any = {
      id: targetId,
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
      subscription_status: user.subscriptionStatus || null,
      subscription_plan: user.subscriptionPlan || null,
      plan_tier: user.planTier || null,
      trial_ends_at: user.trialEndsAt || null,
      subscription_ends_at: user.subscriptionEndsAt || null,
      device_fingerprint: user.deviceFingerprint || null,
      updated_at: new Date().toISOString(),
    };

    const validCoords = isValidCoordinate(user.latitude, user.longitude);

    const extendedPayload = {
      ...basePayload,
      profile_completed: user.profileCompleted ?? false,
      experience_level: user.experienceLevel || null,
      height: user.height ?? null,
      weight: user.weight ?? null,
      city: user.city || null,
      state: user.state || null,
      neighborhood: user.neighborhood || null,
      latitude: validCoords ? user.latitude : null,
      longitude: validCoords ? user.longitude : null,
      operating_radius_km: user.operatingRadiusKm ?? null,
      service_modality: user.serviceModality || null,
      pix_key: user.pixKey || null,
      pix_key_type: user.pixKeyType || null,
      pix_name: user.pixName || null,
      pix_bank: user.pixBank || null,
      terms_accepted: user.termsAccepted ?? false,
      terms_accepted_at: user.termsAcceptedAt || null,
      allow_booking_messages: user.allowBookingMessages !== undefined ? user.allowBookingMessages : true,
      subscription_canceled_at: user.subscriptionCanceledAt || null,
      cancel_reason: user.cancelReason || null,
      cancel_feedback: user.cancelFeedback || null,
      mercadopago_subscription_id: user.mercadopagoSubscriptionId || null,
    };

    const { error } = await client.from("profiles").upsert(extendedPayload, { onConflict: "id" });
    if (error) {
      if (error.message && (error.message.includes("does not exist") || error.message.includes("column"))) {
        const { error: fallbackError } = await client.from("profiles").upsert(basePayload, { onConflict: "id" });
        if (fallbackError) {
          console.warn("⚠️ [Supabase] Erro no fallback ao salvar perfil:", fallbackError.message);
          return false;
        }
        invalidateSupabaseCache(`profile_${targetId}`);
        invalidateSupabaseCache(`profile_${user.id}`);
        return true;
      }
      console.warn("⚠️ [Supabase] Erro ao salvar perfil:", error.message);
      return false;
    }
    invalidateSupabaseCache(`profile_${targetId}`);
    invalidateSupabaseCache(`profile_${user.id}`);
    return true;
  } catch (err) {
    console.warn("⚠️ [Supabase] Exceção ao salvar perfil:", err);
    return false;
  }
}

export async function fetchProfileFromSupabase(userId: string): Promise<UserProfile | null> {
  const client = getSupabase();
  if (!client) return null;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  if (!isUUID) return null;

  const cacheKey = `profile_${userId}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name || "Usuário",
        email: data.email || "",
        phone: data.phone || "",
        activeRole: data.active_role || "student",
        enabledRoles: data.enabled_roles || (data.active_role === "coach" ? ["coach", "student"] : ["student"]),
        matricula: data.matricula || `GF-${data.id.slice(0, 5)}`,
        goal: data.goal || "Hipertrofia",
        experienceLevel: data.experience_level || undefined,
        profileCompleted: data.profile_completed ?? false,
        height: data.height ? Number(data.height) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        termsAccepted: data.terms_accepted ?? false,
        termsAcceptedAt: data.terms_accepted_at || undefined,
        cref: data.cref || undefined,
        specialty: data.specialty || undefined,
        bio: data.bio || undefined,
        hourlyRate: data.hourly_rate ?? 35,
        avatarUrl: data.avatar_url || undefined,
        instagram: data.instagram || undefined,
        location: data.location || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        neighborhood: data.neighborhood || undefined,
        latitude: data.latitude !== null && data.latitude !== undefined ? Number(data.latitude) : undefined,
        longitude: data.longitude !== null && data.longitude !== undefined ? Number(data.longitude) : undefined,
        operatingRadiusKm: data.operating_radius_km !== null && data.operating_radius_km !== undefined ? Number(data.operating_radius_km) : undefined,
        serviceModality: data.service_modality || undefined,
        pricing: data.pricing || undefined,
        pixKey: data.pix_key || undefined,
        pixKeyType: data.pix_key_type || undefined,
        pixName: data.pix_name || undefined,
        pixBank: data.pix_bank || undefined,
        subscriptionStatus: data.subscription_status || undefined,
        subscriptionPlan: data.subscription_plan || undefined,
        planTier: data.plan_tier || undefined,
        trialEndsAt: data.trial_ends_at || undefined,
        subscriptionEndsAt: data.subscription_ends_at || undefined,
        subscriptionCanceledAt: data.subscription_canceled_at || undefined,
        cancelReason: data.cancel_reason || undefined,
        cancelFeedback: data.cancel_feedback || undefined,
        mercadopagoSubscriptionId: data.mercadopago_subscription_id || undefined,
        deviceFingerprint: data.device_fingerprint || undefined,
        allowBookingMessages: data.allow_booking_messages !== undefined ? Boolean(data.allow_booking_messages) : true,
      };
    } catch {
      return null;
    }
  }, 30000); // 30s TTL
}

