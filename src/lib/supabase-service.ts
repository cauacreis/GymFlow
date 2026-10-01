/**
 * Supabase Service Layer
 * Camada de comunicação com o Supabase com tratamento defensivo e fallback gracioso
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";
import { StudentProfile, CoachPlanOption, StudentWorkoutPackage } from "./workout-store";
import { BookingRequest, CoachTrainer, AppNotification } from "./booking-store";
import { UserProfile } from "./auth-store";
import { isValidCoordinate } from "./geo";
import type { BodyMetricEntry } from "./body-metrics-store";
import type { CardioSessionLog } from "./cardio-store";
import type { StoredBadgeProgress } from "./gamification-service";
import type { CoachWorkoutRoutine } from "./coach-routines-store";

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

// ============================================================================
// MEDIÇÕES CORPORAIS (BODY METRICS & BIOIMPEDÂNCIA)
// ============================================================================

export async function fetchBodyMetricsFromSupabase(userId?: string): Promise<BodyMetricEntry[] | null> {
  const client = getSupabase();
  if (!client) return null;

  let targetId = userId;
  if (!targetId) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) targetId = session.user.id;
    } catch {}
  }
  if (!targetId) return [];

  const cacheKey = `body_metrics_${targetId}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      let query = client.from("body_metrics").select("*");
      if (isUUID) {
        query = query.or(`user_id.eq.${targetId},student_id.eq.${targetId}`);
      } else {
        query = query.eq("student_id", targetId);
      }

      const { data, error } = await query.order("date", { ascending: true });
      if (error || !data) return null;

      return data.map((row: any): BodyMetricEntry => ({
        id: row.id,
        date: row.date,
        dateFormatted: row.date_formatted || row.date,
        weight: Number(row.weight),
        bodyFat: Number(row.body_fat),
        muscleMass: Number(row.muscle_mass),
        fatMass: row.fat_mass !== null ? Number(row.fat_mass) : undefined,
        waistCm: row.waist_cm !== null ? Number(row.waist_cm) : undefined,
        armCm: row.arm_cm !== null ? Number(row.arm_cm) : undefined,
        chestCm: row.chest_cm !== null ? Number(row.chest_cm) : undefined,
        thighCm: row.thigh_cm !== null ? Number(row.thigh_cm) : undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
      }));
    } catch {
      return null;
    }
  }, 20000);
}

export async function upsertBodyMetricToSupabase(metric: BodyMetricEntry, userId?: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    let resolvedUserId: string | null = null;
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      resolvedUserId = userId;
    } else {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) resolvedUserId = session.user.id;
    }

    const payload = {
      id: metric.id,
      user_id: resolvedUserId,
      student_id: userId || resolvedUserId || "student_me",
      date: metric.date,
      date_formatted: metric.dateFormatted,
      weight: metric.weight,
      body_fat: metric.bodyFat,
      muscle_mass: metric.muscleMass,
      fat_mass: metric.fatMass ?? null,
      waist_cm: metric.waistCm ?? null,
      arm_cm: metric.armCm ?? null,
      chest_cm: metric.chestCm ?? null,
      thigh_cm: metric.thighCm ?? null,
      notes: metric.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("body_metrics").upsert(payload, { onConflict: "id" });
    if (!error) {
      invalidateSupabaseCache("body_metrics_");
    }
    return !error;
  } catch {
    return false;
  }
}

export async function deleteBodyMetricFromSupabase(metricId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from("body_metrics").delete().eq("id", metricId);
    if (!error) {
      invalidateSupabaseCache("body_metrics_");
    }
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// HISTÓRICO DE CÁRDIO (CARDIO SESSIONS)
// ============================================================================

export async function fetchCardioSessionsFromSupabase(studentId?: string): Promise<CardioSessionLog[] | null> {
  const client = getSupabase();
  if (!client) return null;

  let targetStudentId = studentId;
  if (!targetStudentId) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) targetStudentId = session.user.id;
    } catch {}
  }
  if (!targetStudentId) return [];

  const cacheKey = `cardio_sessions_${targetStudentId}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetStudentId);
      let query = client.from("cardio_sessions").select("*");
      if (isUUID) {
        query = query.or(`user_id.eq.${targetStudentId},student_id.eq.${targetStudentId}`);
      } else {
        query = query.eq("student_id", targetStudentId);
      }

      const { data, error } = await query.order("completed_at", { ascending: false });
      if (error || !data) return null;

      return data.map((row: any): CardioSessionLog => ({
        id: row.id,
        studentId: row.student_id,
        title: row.title,
        modality: row.modality,
        modalityLabel: row.modality_label,
        durationMinutes: row.duration_minutes,
        actualSeconds: row.actual_seconds,
        actualCalories: row.actual_calories,
        intensity: row.intensity || "moderada",
        source: row.source || "manual",
        speedKmh: row.speed_kmh !== null ? Number(row.speed_kmh) : undefined,
        inclinePercent: row.incline_percent !== null ? Number(row.incline_percent) : undefined,
        notes: row.notes || undefined,
        completedAt: row.completed_at,
      }));
    } catch {
      return null;
    }
  }, 20000);
}

export async function upsertCardioSessionToSupabase(session: CardioSessionLog, userId?: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    let resolvedUserId: string | null = null;
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      resolvedUserId = userId;
    } else {
      const { data: { session: authSess } } = await client.auth.getSession();
      if (authSess?.user?.id) resolvedUserId = authSess.user.id;
    }

    const payload = {
      id: session.id,
      user_id: resolvedUserId,
      student_id: session.studentId || resolvedUserId || "student_carlos",
      title: session.title,
      modality: session.modality,
      modality_label: session.modalityLabel,
      duration_minutes: session.durationMinutes,
      actual_seconds: session.actualSeconds || session.durationMinutes * 60,
      actual_calories: session.actualCalories,
      intensity: session.intensity || "moderada",
      source: session.source || "manual",
      speed_kmh: session.speedKmh ?? null,
      incline_percent: session.inclinePercent ?? null,
      notes: session.notes ?? null,
      completed_at: session.completedAt,
    };

    const { error } = await client.from("cardio_sessions").upsert(payload, { onConflict: "id" });
    if (!error) {
      invalidateSupabaseCache("cardio_sessions_");
    }
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCardioSessionFromSupabase(sessionId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from("cardio_sessions").delete().eq("id", sessionId);
    if (!error) {
      invalidateSupabaseCache("cardio_sessions_");
    }
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// GAMIFICAÇÃO & CONQUISTAS (USER ACHIEVEMENTS)
// ============================================================================

export async function fetchAchievementsFromSupabase(userId?: string): Promise<Record<string, StoredBadgeProgress> | null> {
  const client = getSupabase();
  if (!client) return null;

  let targetId = userId;
  if (!targetId) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) targetId = session.user.id;
    } catch {}
  }
  if (!targetId) return null;

  const cacheKey = `user_achievements_${targetId}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      let query = client.from("user_achievements").select("*");
      if (isUUID) {
        query = query.or(`user_id.eq.${targetId},student_id.eq.${targetId}`);
      } else {
        query = query.eq("student_id", targetId);
      }

      const { data, error } = await query;
      if (error || !data) return null;

      const progressMap: Record<string, StoredBadgeProgress> = {};
      data.forEach((row: any) => {
        progressMap[row.badge_id] = {
          currentProgress: row.current_progress,
          currentLevel: row.current_level,
          unlocked: row.unlocked,
          unlockedAt: row.unlocked_at || undefined,
          lastNotifiedLevel: row.last_notified_level,
        };
      });
      return progressMap;
    } catch {
      return null;
    }
  }, 20000);
}

export async function upsertAchievementToSupabase(
  badgeId: string,
  progress: StoredBadgeProgress,
  userId?: string,
  role: "student" | "coach" = "student"
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    let resolvedUserId: string | null = null;
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      resolvedUserId = userId;
    } else {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) resolvedUserId = session.user.id;
    }

    const recId = `ach_${resolvedUserId || userId || "me"}_${badgeId}`;
    const payload = {
      id: recId,
      user_id: resolvedUserId,
      student_id: userId || resolvedUserId || "student_me",
      badge_id: badgeId,
      role,
      current_progress: progress.currentProgress,
      current_level: progress.currentLevel,
      unlocked: progress.unlocked,
      unlocked_at: progress.unlockedAt || null,
      last_notified_level: progress.lastNotifiedLevel,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("user_achievements").upsert(payload, { onConflict: "id" });
    if (!error) {
      invalidateSupabaseCache("user_achievements_");
    }
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// MODELOS DE ROTINA DO TREINADOR (COACH ROUTINE TEMPLATES)
// ============================================================================

export async function fetchCoachRoutinesFromSupabase(coachId?: string): Promise<CoachWorkoutRoutine[] | null> {
  const client = getSupabase();
  if (!client) return null;

  const targetCoachId = coachId || "coach_rodrigo";
  const cacheKey = `coach_routines_${targetCoachId}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      const { data, error } = await client
        .from("coach_routine_templates")
        .select("*")
        .eq("coach_id", targetCoachId)
        .order("created_at", { ascending: false });

      if (error || !data) return null;

      return data.map((r: any): CoachWorkoutRoutine => ({
        id: r.id,
        name: r.name,
        category: r.category,
        difficulty: r.difficulty || "Intermediário",
        description: r.description || "",
        frequency: r.frequency || "4 dias na semana",
        isCustom: true,
        coachName: "Personal Trainer",
        splits: r.splits || [],
      }));
    } catch {
      return null;
    }
  }, 30000);
}

export async function upsertCoachRoutineToSupabase(routine: CoachWorkoutRoutine, coachId?: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const targetCoachId = coachId || "coach_rodrigo";
    const payload = {
      id: routine.id,
      coach_id: targetCoachId,
      name: routine.name,
      category: routine.category || "Geral",
      difficulty: routine.difficulty || "Intermediário",
      description: routine.description || null,
      frequency: routine.frequency || null,
      splits: routine.splits || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from("coach_routine_templates").upsert(payload, { onConflict: "id" });
    if (!error) {
      invalidateSupabaseCache("coach_routines_");
    }
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCoachRoutineFromSupabase(routineId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from("coach_routine_templates").delete().eq("id", routineId);
    if (!error) {
      invalidateSupabaseCache("coach_routines_");
    }
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// LOTAÇÃO DA ACADEMIA (GYM OCCUPANCY)
// ============================================================================

export async function fetchOccupancyFromSupabase(): Promise<{
  currentCount: number;
  maxCapacity: number;
  occupancyPercent: number;
  statusLabel: string;
  hourlyDistribution: any[];
} | null> {
  const client = getSupabase();
  if (!client) return null;

  return deduplicatedFetch("gym_occupancy_main", async () => {
    try {
      const { data, error } = await client
        .from("gym_occupancy")
        .select("*")
        .eq("id", "main_facility")
        .maybeSingle();

      if (error || !data) return null;

      return {
        currentCount: data.current_count,
        maxCapacity: data.max_capacity,
        occupancyPercent: data.occupancy_percent,
        statusLabel: data.status_label,
        hourlyDistribution: data.hourly_distribution || [],
      };
    } catch {
      return null;
    }
  }, 10000); // 10s TTL
}

// ============================================================================
// CATRACA E LOGS DE ACESSO (CHECK-IN)
// ============================================================================

export async function recordCheckinInSupabase(entry: {
  studentName: string;
  matricula?: string;
  deviceId?: string;
  turnstileToken?: string;
  status?: "granted" | "denied" | "expired";
}): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    let resolvedUserId: string | null = null;
    const { data: { session } } = await client.auth.getSession();
    if (session?.user?.id) resolvedUserId = session.user.id;

    const payload = {
      id: `checkin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: resolvedUserId,
      student_name: entry.studentName,
      matricula: entry.matricula || null,
      device_id: entry.deviceId || null,
      turnstile_token: entry.turnstileToken || null,
      status: entry.status || "granted",
      created_at: new Date().toISOString(),
    };

    const { error } = await client.from("access_logs").insert(payload);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// AVALIAÇÕES E PROVA SOCIAL (REVIEWS)
// ============================================================================

export interface ReviewItem {
  id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  coachId?: string;
}

export async function fetchReviewsFromSupabase(coachId?: string): Promise<ReviewItem[] | null> {
  const client = getSupabase();
  if (!client) return null;

  const cacheKey = `reviews_${coachId || "all"}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      let query = client.from("reviews").select("*");
      if (coachId) query = query.eq("coach_id", coachId);

      const { data, error } = await query.order("created_at", { ascending: false }).limit(20);
      if (error || !data) return null;

      return data.map((r: any): ReviewItem => ({
        id: r.id,
        name: r.student_name,
        avatar: r.student_avatar || "/avatars/default.png",
        role: "Aluno Verificado",
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString("pt-BR"),
        comment: r.comment,
        verified: r.verified_member ?? true,
        coachId: r.coach_id || undefined,
      }));
    } catch {
      return null;
    }
  }, 30000);
}

export async function submitReviewToSupabase(review: {
  studentName: string;
  studentAvatar?: string;
  rating: number;
  comment: string;
  coachId?: string;
}): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    let resolvedUserId: string | null = null;
    const { data: { session } } = await client.auth.getSession();
    if (session?.user?.id) resolvedUserId = session.user.id;

    const payload = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: resolvedUserId,
      student_name: review.studentName,
      student_avatar: review.studentAvatar || null,
      rating: review.rating,
      comment: review.comment,
      coach_id: review.coachId || null,
      verified_member: true,
      created_at: new Date().toISOString(),
    };

    const { error } = await client.from("reviews").insert(payload);
    if (!error) {
      invalidateSupabaseCache("reviews_");
    }
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// PEDIDOS & SACOLA FIT (ORDERS)
// ============================================================================

export interface GymOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: "pending" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  paymentMethod: string;
  createdAt: string;
}

export async function fetchOrdersFromSupabase(userId?: string): Promise<GymOrder[] | null> {
  const client = getSupabase();
  if (!client) return null;

  let targetId = userId;
  if (!targetId) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) targetId = session.user.id;
    } catch {}
  }
  if (!targetId) return [];

  const cacheKey = `orders_${targetId}`;

  return deduplicatedFetch(cacheKey, async () => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      let query = client.from("orders").select("*");
      if (isUUID) {
        query = query.or(`user_id.eq.${targetId},student_id.eq.${targetId}`);
      } else {
        query = query.eq("student_id", targetId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error || !data) return null;

      return data.map((o: any): GymOrder => ({
        id: o.id,
        customerName: o.customer_name,
        customerPhone: o.customer_phone || undefined,
        deliveryAddress: o.delivery_address || undefined,
        items: o.items || [],
        subtotal: Number(o.subtotal),
        deliveryFee: Number(o.delivery_fee || 0),
        total: Number(o.total),
        status: o.status,
        paymentMethod: o.payment_method || "pix",
        createdAt: o.created_at,
      }));
    } catch {
      return null;
    }
  }, 15000);
}

export async function createOrderInSupabase(order: Omit<GymOrder, "id" | "createdAt"> & { id?: string }): Promise<GymOrder | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    let resolvedUserId: string | null = null;
    const { data: { session } } = await client.auth.getSession();
    if (session?.user?.id) resolvedUserId = session.user.id;

    const finalId = order.id || `order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const payload = {
      id: finalId,
      user_id: resolvedUserId,
      student_id: resolvedUserId || "student_me",
      customer_name: order.customerName,
      customer_phone: order.customerPhone || null,
      delivery_address: order.deliveryAddress || null,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      status: order.status || "preparing",
      payment_method: order.paymentMethod || "pix",
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { error } = await client.from("orders").insert(payload);
    if (error) return null;

    invalidateSupabaseCache("orders_");
    return {
      id: finalId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      status: order.status || "preparing",
      paymentMethod: order.paymentMethod || "pix",
      createdAt: nowIso,
    };
  } catch {
    return null;
  }
}

