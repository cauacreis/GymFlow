/**
 * Auth & User Profile Store
 * Suporta contas de Aluno e Professor (Personal Trainer) com alternância dinâmica de papéis
 */

export type UserRole = "student" | "coach";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  activeRole: UserRole;
  enabledRoles: UserRole[]; // Permite que a pessoa treine E seja treinada (ambos os modos ativos)
  // Campos específicos de Aluno & Biometria Corporal
  goal?: "Hipertrofia" | "Emagrecimento" | "Força & Performance" | "Condicionamento Geral" | (string & {});
  experienceLevel?: "Iniciante" | "Intermediário" | "Avançado";
  profileCompleted?: boolean;
  matricula?: string;
  height?: number; // Altura em cm (ex: 178)
  weight?: number; // Peso corporal atual em kg (ex: 78.4)
  bodyFat?: number; // Percentual de gordura atual em % (ex: 13.8)
  targetWeight?: number; // Meta de peso em kg (ex: 76.0)
  targetBodyFat?: number; // Meta de gordura em % (ex: 12.0)
  gender?: "masculino" | "feminino" | "outro";
  birthDate?: string;
  // Campos específicos de Professor
  cref?: string;
  specialty?: string;
  bio?: string;
  hourlyRate?: number;
  avatarUrl?: string;
  instagram?: string;
  location?: string;
  // Localização geográfica e atuação regional (Aluno & Personal)
  city?: string;
  state?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  operatingRadiusKm?: number;
  serviceModality?: "presencial" | "online" | "hibrido";
  pricing?: {
    basicMonthly: number;
    proMonthly: number;
    vipMonthly: number;
    dailySession?: number;
    weeklyPlan?: number;
    monthlyPlan?: number;
  };
  coachPlans?: CoachPlanOption[];
  defaultPaymentDueDay?: number; // Dia de vencimento padrão para alunos do personal (1 a 31, ex: 10)
  // Configuração de Pagamento & PIX do Personal Trainer
  pixKey?: string;
  pixKeyType?: "cpf" | "cnpj" | "email" | "phone" | "random";
  pixName?: string;
  pixBank?: string;
  // Gestão de Assinatura & Acesso Paywall
  subscriptionStatus?: "trial" | "active" | "past_due" | "expired" | "pending_choice";
  subscriptionPlan?: "trial_7d" | "monthly_recurring" | "monthly_pix" | "annual_pro" | "basico" | "pro" | "vip" | string;
  planTier?: "basico" | "pro" | "vip";
  trialEndsAt?: string; // Data ISO do fim dos 7 dias grátis
  subscriptionEndsAt?: string; // Data ISO do fim da assinatura paga
  deviceFingerprint?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
}

import type { CoachPlanOption } from "./workout-store";
import { saveProfileToSupabase, fetchProfileFromSupabase } from "./supabase-service";
import { getSupabase } from "./supabase";
import { registerDeviceAccount } from "./device-lockout";

const STORAGE_KEY_AUTH = "gymflow_current_user_v4";
const EVENT_AUTH_CHANGED = "gymflow:auth-changed";

const DEFAULT_USER: UserProfile = {
  id: "user_me",
  name: "Aluno Convidado",
  email: "",
  phone: "",
  activeRole: "student",
  enabledRoles: ["student"],
  avatarUrl: "",
  goal: "Hipertrofia",
  experienceLevel: "Iniciante",
  profileCompleted: false,
  matricula: "GF-10001",
  height: 175,
  weight: 74.0,
  bodyFat: 15.0,
  targetWeight: 76.0,
  targetBodyFat: 12.0,
  gender: "masculino",
  cref: "",
  specialty: "",
  bio: "",
  hourlyRate: 35,
  instagram: "",
  location: "Salão Principal",
  city: undefined,
  state: undefined,
  neighborhood: undefined,
  latitude: undefined,
  longitude: undefined,
  operatingRadiusKm: 15,
  serviceModality: "hibrido",
  pricing: {
    basicMonthly: 35,
    proMonthly: 45,
    vipMonthly: 55,
    dailySession: 35,
    weeklyPlan: 45,
    monthlyPlan: 55,
  },
  defaultPaymentDueDay: 10,
  termsAccepted: true,
  termsAcceptedAt: new Date().toISOString(),
};

export function isUserAuthenticated(user?: UserProfile): boolean {
  if (user) {
    return Boolean(
      user.email &&
      user.email.includes("@") &&
      user.id &&
      user.id !== "user_me"
    );
  }
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(
      parsed &&
      parsed.email &&
      parsed.email.includes("@") &&
      parsed.id &&
      parsed.id !== "user_me"
    );
  } catch {
    return false;
  }
}

/**
 * Extrai de forma resiliente o nome completo de metadados OAuth/Supabase,
 * tratando casos onde provedores como Apple retornam objetos { firstName, lastName }.
 */
export function extractFullName(meta: any, fallbackEmail?: string): string {
  if (!meta) return fallbackEmail ? fallbackEmail.split("@")[0] : "Usuário";
  if (typeof meta.full_name === "string" && meta.full_name.trim()) return meta.full_name.trim();
  if (typeof meta.name === "string" && meta.name.trim()) return meta.name.trim();
  if (meta.full_name && typeof meta.full_name === "object") {
    const parts = [meta.full_name.firstName, meta.full_name.lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  }
  if (meta.name && typeof meta.name === "object") {
    const parts = [meta.name.firstName, meta.name.lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  }
  return fallbackEmail ? fallbackEmail.split("@")[0] : "Usuário";
}

/**
 * Valida se o usuário autenticado concluiu a personalização do seu perfil.
 * Novo usuário (OAuth ou cadastro sem dados completos) precisará completar:
 * 1. Nome válido (mínimo 2 caracteres)
 * 2. WhatsApp com DDD (obrigatório para lembretes de treinos e pagamentos, mínimo 10 dígitos e DDD válido entre 11 e 99)
 * 3. Confirmação do papel com campos específicos (CREF/especialidade para coach ou objetivo/experiência para aluno)
 * 4. Consentimento com Termos e LGPD
 */
export function isProfileComplete(user?: UserProfile): boolean {
  const u = user || getCurrentUser();
  if (!isUserAuthenticated(u)) return false;

  // 1. Se a flag explícita de conclusão de perfil estiver marcada, retorna true
  if (u.profileCompleted) return true;

  // 2. Valida se possui nome com pelo menos 2 caracteres e não é o nome genérico padrão
  const hasValidName = Boolean(
    u.name &&
    u.name.trim().length >= 2 &&
    u.name !== "Usuário" &&
    u.name !== "Aluno Convidado"
  );

  // 3. Validação por Papel Ativo
  const hasRoleData =
    u.activeRole === "coach"
      ? Boolean(u.specialty && u.specialty.trim().length >= 2)
      : Boolean(u.goal && u.goal.trim().length >= 2);

  // 4. Se tiver nome e dados de objetivo/especialidade preenchidos
  if (hasValidName && hasRoleData) {
    return true;
  }

  return false;
}

/**
 * Valida se o usuário tem direito de acesso ao aplicativo:
 * 1. Treinadores com conta cadastrada têm acesso total
 * 2. Alunos com plano 'active' (com data válida) ou trial de 7 dias válido têm acesso
 * 3. Alunos recém-cadastrados ou com assinatura/trial expirada devem escolher/renovar assinatura
 */
export function hasActiveAccess(user?: UserProfile): boolean {
  const u = user || getCurrentUser();
  if (!isUserAuthenticated(u)) return false;
  if (u.activeRole === "coach") return true;

  const status = u.subscriptionStatus;
  if (!status || status === "pending_choice" || status === "expired" || status === "past_due") {
    return false;
  }

  const now = Date.now();

  if (status === "active") {
    if (u.subscriptionEndsAt) {
      const isExpired = new Date(u.subscriptionEndsAt).getTime() <= now;
      if (isExpired) {
        return false;
      }
    }
    return true;
  }

  if (status === "trial") {
    if (!u.trialEndsAt) return true;
    const isExpired = new Date(u.trialEndsAt).getTime() <= now;
    return !isExpired;
  }

  return false;
}

export function activateTrialForUser(days: number = 7): UserProfile {
  const u = getCurrentUser();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + days);

  const updated: UserProfile = {
    ...u,
    subscriptionStatus: "trial",
    subscriptionPlan: "trial_7d",
    planTier: "pro",
    trialEndsAt: trialEndDate.toISOString(),
  };

  saveUserProfile(updated);
  return updated;
}

export function activatePaidPlanForUser(
  planId: string,
  isRecurring: boolean = false,
  tier?: "basico" | "pro" | "vip"
): UserProfile {
  const u = getCurrentUser();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  let determinedTier: "basico" | "pro" | "vip" = tier || "pro";
  if (planId === "basico") determinedTier = "basico";
  else if (planId === "vip") determinedTier = "vip";

  const updated: UserProfile = {
    ...u,
    subscriptionStatus: "active",
    subscriptionPlan: isRecurring ? "monthly_recurring" : planId,
    planTier: determinedTier,
    subscriptionEndsAt: endDate.toISOString(),
  };

  saveUserProfile(updated);
  return updated;
}

export function getCurrentUser(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    const parsed: UserProfile = { ...DEFAULT_USER, ...JSON.parse(raw) };
    // Normalização defensiva de preços
    if (parsed.pricing) {
      const basic = parsed.pricing.basicMonthly && parsed.pricing.basicMonthly <= 60 ? parsed.pricing.basicMonthly : 35;
      const pro = parsed.pricing.proMonthly && parsed.pricing.proMonthly <= 75 ? parsed.pricing.proMonthly : 45;
      const vip = parsed.pricing.vipMonthly && parsed.pricing.vipMonthly <= 90 ? parsed.pricing.vipMonthly : 55;
      parsed.pricing = {
        basicMonthly: basic,
        proMonthly: pro,
        vipMonthly: vip,
        dailySession: basic,
        weeklyPlan: pro,
        monthlyPlan: vip,
      };
    }
    return parsed;
  } catch (e) {
    return DEFAULT_USER;
  }
}

export function saveUserProfile(updated: Partial<UserProfile>): UserProfile {
  const current = getCurrentUser();
  const merged: UserProfile = {
    ...current,
    ...updated,
    enabledRoles: updated.enabledRoles
      ? Array.from(new Set(updated.enabledRoles))
      : (current.enabledRoles || [current.activeRole || "student"]),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(merged));
    // Seta cookie para o middleware reconhecer sessões autenticadas
    if (merged.email && merged.id !== "user_me") {
      document.cookie = "gymflow_session=active; path=/; max-age=2592000; SameSite=Lax";
    }
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_CHANGED, { detail: merged }));
  }

  // Sincroniza em segundo plano com Supabase se estiver configurado
  saveProfileToSupabase(merged).catch(() => {});

  return merged;
}

export function switchUserRole(newRole: UserRole): UserProfile {
  const current = getCurrentUser();
  // Bloqueia alternar para professor se a conta não tiver essa permissão ativada
  if (!current.enabledRoles?.includes(newRole)) {
    console.warn(`⚠️ [AuthStore] Não é possível alternar para ${newRole}: o papel não está habilitado para esta conta.`);
    return current;
  }

  const updated: UserProfile = {
    ...current,
    activeRole: newRole,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_CHANGED, { detail: updated }));
  }

  // Persiste a alternância de papel no Supabase para não ser revertida na próxima sessão
  saveProfileToSupabase(updated).catch(() => {});

  return updated;
}

/**
 * Ativa o modo Professor para uma conta de Aluno após preenchimento
 * das informações profissionais obrigatórias.
 */
export function enableCoachRole(data: {
  specialty: string;
  cref?: string;
  bio?: string;
  location?: string;
  instagram?: string;
  pricing?: {
    basicMonthly: number;
    proMonthly: number;
    vipMonthly: number;
  };
}): UserProfile {
  const current = getCurrentUser();
  const enabledRoles: UserRole[] = Array.from(
    new Set([...(current.enabledRoles || ["student"]), "coach" as UserRole])
  );

  const updated: UserProfile = {
    ...current,
    activeRole: "coach",
    enabledRoles,
    specialty: data.specialty.trim(),
    cref: data.cref?.trim() || undefined,
    bio: data.bio?.trim() || undefined,
    location: data.location?.trim() || current.location || "Salão Principal",
    instagram: data.instagram?.trim() || current.instagram,
    pricing: data.pricing || current.pricing || {
      basicMonthly: 35,
      proMonthly: 45,
      vipMonthly: 55,
      dailySession: 35,
      weeklyPlan: 45,
      monthlyPlan: 55,
    },
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_CHANGED, { detail: updated }));
  }

  saveProfileToSupabase(updated).catch(() => {});
  return updated;
}

export function registerNewUser(data: {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  cref?: string;
  specialty?: string;
  bio?: string;
  hourlyRate?: number;
  goal?: UserProfile["goal"];
  experienceLevel?: UserProfile["experienceLevel"];
  height?: number;
  weight?: number;
  id?: string;
  profileCompleted?: boolean;
  termsAccepted?: boolean;
}): UserProfile {
  const isCompleted =
    data.profileCompleted !== undefined
      ? data.profileCompleted
      : Boolean(
          data.name &&
          data.name.trim().length >= 2 &&
          (data.role === "coach" ? Boolean(data.specialty) : Boolean(data.goal)) &&
          (data.termsAccepted ?? true)
        );

  const newUser: UserProfile = {
    id: data.id || `user_${Date.now()}`,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    activeRole: data.role,
    // Se a conta for criada como aluno, enabledRoles é estritamente ["student"]!
    // Não ganha papel de professor até que decida ativar nas configurações.
    enabledRoles: data.role === "coach" ? ["coach", "student"] : ["student"],
    matricula: `GF-${Math.floor(10000 + Math.random() * 90000)}`,
    goal: data.goal || "Hipertrofia",
    experienceLevel: data.experienceLevel || (data.role === "student" ? "Iniciante" : "Avançado"),
    cref: data.cref?.trim() || undefined,
    specialty: data.specialty || (data.role === "coach" ? "Musculação & Hipertrofia" : undefined),
    bio: data.bio || (data.role === "coach" ? "Treinador especialista em performance e técnica perfeita." : undefined),
    hourlyRate: data.hourlyRate || (data.role === "coach" ? 70 : undefined),
    height: data.height,
    weight: data.weight,
    profileCompleted: isCompleted,
    termsAccepted: data.termsAccepted ?? true,
    termsAcceptedAt: data.termsAccepted ? new Date().toISOString() : undefined,
    subscriptionStatus: data.role === "coach" ? "active" : "trial",
    subscriptionPlan: data.role === "coach" ? "coach_unlimited" : "trial_7d",
    planTier: "pro",
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newUser));
    document.cookie = "gymflow_session=active; path=/; max-age=2592000; SameSite=Lax";
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_CHANGED, { detail: newUser }));
  }

  // Sincroniza em segundo plano com Supabase
  saveProfileToSupabase(newUser).catch(() => {});

  return newUser;
}

export function logoutUser(): void {
  if (typeof window === "undefined") return;
  const client = getSupabase();
  if (client) {
    client.auth.signOut().catch(() => {});
  }
  localStorage.removeItem(STORAGE_KEY_AUTH);
  document.cookie = "gymflow_session=; path=/; max-age=0; SameSite=Lax";
  window.dispatchEvent(new CustomEvent(EVENT_AUTH_CHANGED, { detail: DEFAULT_USER }));
}

/**
 * Inicializa a sincronização contínua com a sessão do Supabase Auth
 */
export function initAuthSession(): () => void {
  if (typeof window === "undefined") return () => {};
  const client = getSupabase();
  if (!client) return () => {};

  const syncUserFromSession = async (user: any) => {
    if (!user) return;
    try {
      const currentLocal = getCurrentUser();
      const isSameUser =
        currentLocal.id === user.id ||
        (currentLocal.email && user.email && currentLocal.email.toLowerCase() === user.email.toLowerCase());

      const cloudProfile = await fetchProfileFromSupabase(user.id);
      const meta = user.user_metadata || {};

      let chosenRole: UserRole = (meta.role as UserRole) || (isSameUser ? currentLocal.activeRole : "student");
      let hadExplicitRole = false;
      if (typeof window !== "undefined") {
        const cachedRole = localStorage.getItem("gymflow_oauth_role") as UserRole | null;
        if (cachedRole === "coach" || cachedRole === "student") {
          chosenRole = cachedRole;
          hadExplicitRole = true;
          localStorage.removeItem("gymflow_oauth_role");
        }
      }

      const metaName = extractFullName(meta, user.email);
      const avatarUrl = meta.avatar_url || meta.picture || (isSameUser ? currentLocal.avatarUrl : undefined);

      const resolvedName =
        cloudProfile?.name ||
        (isSameUser && currentLocal.name && currentLocal.name !== "Usuário" && currentLocal.name !== "Aluno Convidado"
          ? currentLocal.name
          : metaName);
      const resolvedRole = hadExplicitRole
        ? chosenRole
        : (cloudProfile?.activeRole || (isSameUser ? currentLocal.activeRole : chosenRole));
      const resolvedPhone =
        cloudProfile?.phone ||
        (isSameUser ? currentLocal.phone : undefined) ||
        meta.phone ||
        "";
      const resolvedGoal =
        cloudProfile?.goal ||
        (isSameUser ? currentLocal.goal : undefined) ||
        meta.goal ||
        "Hipertrofia";
      const resolvedSpecialty =
        cloudProfile?.specialty ||
        (isSameUser ? currentLocal.specialty : undefined) ||
        meta.specialty ||
        (resolvedRole === "coach" ? "Musculação & Hipertrofia" : undefined);
      const resolvedProfileCompleted = Boolean(
        cloudProfile?.profileCompleted ||
        (isSameUser && currentLocal.profileCompleted) ||
        meta.profile_completed ||
        (resolvedName && resolvedName !== "Usuário" && resolvedName !== "Aluno Convidado" && (resolvedRole === "coach" ? resolvedSpecialty : resolvedGoal))
      );

      const resolvedSubscriptionStatus =
        cloudProfile?.subscriptionStatus ||
        (isSameUser ? currentLocal.subscriptionStatus : undefined) ||
        (resolvedRole === "coach" ? "active" : "trial");
      const resolvedSubscriptionPlan =
        cloudProfile?.subscriptionPlan ||
        (isSameUser ? currentLocal.subscriptionPlan : undefined) ||
        (resolvedRole === "coach" ? "coach_unlimited" : "trial_7d");
      const resolvedTrialEndsAt =
        cloudProfile?.trialEndsAt ||
        (isSameUser ? currentLocal.trialEndsAt : undefined) ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const mergedUser: UserProfile = {
        id: user.id,
        email: user.email || (isSameUser ? currentLocal.email : ""),
        name: resolvedName,
        phone: resolvedPhone,
        avatarUrl: cloudProfile?.avatarUrl || avatarUrl,
        activeRole: resolvedRole,
        enabledRoles:
          cloudProfile?.enabledRoles ||
          (isSameUser ? currentLocal.enabledRoles : undefined) ||
          (resolvedRole === "coach" ? ["coach", "student"] : ["student"]),
        matricula:
          cloudProfile?.matricula ||
          (isSameUser ? currentLocal.matricula : undefined) ||
          `GF-${user.id.slice(0, 5)}`,
        goal: resolvedGoal,
        experienceLevel:
          cloudProfile?.experienceLevel ||
          (isSameUser ? currentLocal.experienceLevel : undefined) ||
          meta.experience_level ||
          "Iniciante",
        cref: cloudProfile?.cref || (isSameUser ? currentLocal.cref : undefined) || meta.cref,
        specialty: resolvedSpecialty,
        bio: cloudProfile?.bio || (isSameUser ? currentLocal.bio : undefined) || meta.bio,
        height: cloudProfile?.height ?? (isSameUser ? currentLocal.height : undefined),
        weight: cloudProfile?.weight ?? (isSameUser ? currentLocal.weight : undefined),
        city: cloudProfile?.city || (isSameUser ? currentLocal.city : undefined),
        state: cloudProfile?.state || (isSameUser ? currentLocal.state : undefined),
        neighborhood: cloudProfile?.neighborhood || (isSameUser ? currentLocal.neighborhood : undefined),
        latitude: cloudProfile?.latitude ?? (isSameUser ? currentLocal.latitude : undefined),
        longitude: cloudProfile?.longitude ?? (isSameUser ? currentLocal.longitude : undefined),
        location: cloudProfile?.location || (isSameUser ? currentLocal.location : undefined),
        operatingRadiusKm: cloudProfile?.operatingRadiusKm ?? (isSameUser ? currentLocal.operatingRadiusKm : undefined),
        serviceModality: cloudProfile?.serviceModality || (isSameUser ? currentLocal.serviceModality : undefined),
        pricing: cloudProfile?.pricing || (isSameUser ? currentLocal.pricing : undefined),
        coachPlans: cloudProfile?.coachPlans || (isSameUser ? currentLocal.coachPlans : undefined),
        pixKey: cloudProfile?.pixKey || (isSameUser ? currentLocal.pixKey : undefined),
        pixKeyType: cloudProfile?.pixKeyType || (isSameUser ? currentLocal.pixKeyType : undefined),
        pixName: cloudProfile?.pixName || (isSameUser ? currentLocal.pixName : undefined),
        pixBank: cloudProfile?.pixBank || (isSameUser ? currentLocal.pixBank : undefined),
        termsAccepted:
          cloudProfile?.termsAccepted ??
          (isSameUser ? currentLocal.termsAccepted : undefined) ??
          Boolean(meta.terms_accepted) ??
          true,
        termsAcceptedAt:
          cloudProfile?.termsAcceptedAt ||
          (isSameUser ? currentLocal.termsAcceptedAt : undefined) ||
          meta.terms_accepted_at ||
          new Date().toISOString(),
        profileCompleted: resolvedProfileCompleted,
        subscriptionStatus: resolvedSubscriptionStatus,
        subscriptionPlan: resolvedSubscriptionPlan,
        planTier: cloudProfile?.planTier || (isSameUser ? currentLocal.planTier : undefined) || "pro",
        trialEndsAt: resolvedTrialEndsAt,
        subscriptionEndsAt: cloudProfile?.subscriptionEndsAt || (isSameUser ? currentLocal.subscriptionEndsAt : undefined),
      };

      const saved = saveUserProfile(mergedUser);

      // 🛡️ Proteção Anti-Abuso Silenciosa: vincula o dispositivo à conta autenticada
      if (user.email && user.id) {
        registerDeviceAccount({
          email: user.email,
          userId: user.id,
          trialUsed: false,
          plan: saved.subscriptionPlan || "trial_7d",
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("⚠️ [AuthStore] Erro ao sincronizar sessão com perfil:", err);
    }
  };

  // 1. Inspeciona a sessão atual no Supabase
  client.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      await syncUserFromSession(session.user);
    }
  }).catch(() => {});

  // 2. Escuta mudanças na autenticação do Supabase
  const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
      if (session?.user) {
        await syncUserFromSession(session.user);
      }
    } else if (event === "SIGNED_OUT") {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      document.cookie = "gymflow_session=; path=/; max-age=0; SameSite=Lax";
      window.dispatchEvent(new CustomEvent(EVENT_AUTH_CHANGED, { detail: DEFAULT_USER }));
    } else if (event === "PASSWORD_RECOVERY") {
      window.dispatchEvent(new CustomEvent("gymflow:password-recovery"));
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

export function subscribeToAuth(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_AUTH_CHANGED, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_AUTH_CHANGED, callback);
    window.removeEventListener("storage", callback);
  };
}

export function subscribeToAuthChanges(callback: (user: UserProfile) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    callback(getCurrentUser());
  };
  window.addEventListener(EVENT_AUTH_CHANGED, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_AUTH_CHANGED, handler);
    window.removeEventListener("storage", handler);
  };
}

