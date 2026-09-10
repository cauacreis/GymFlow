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
  // Campos específicos de Aluno
  goal?: "Hipertrofia" | "Emagrecimento" | "Força & Performance" | "Condicionamento Geral";
  matricula?: string;
  // Campos específicos de Professor
  cref?: string;
  specialty?: string;
  bio?: string;
  hourlyRate?: number;
  avatarUrl?: string;
  instagram?: string;
  location?: string;
  pricing?: {
    basicMonthly: number;
    proMonthly: number;
    vipMonthly: number;
    dailySession?: number;
    weeklyPlan?: number;
    monthlyPlan?: number;
  };
}

const STORAGE_KEY_AUTH = "gymflow_current_user_v3";
const EVENT_AUTH_CHANGED = "gymflow:auth-changed";

const DEFAULT_USER: UserProfile = {
  id: "user_carlos",
  name: "Carlos Silva",
  email: "carlos.silva@gymflow.app",
  phone: "11991234567",
  activeRole: "student",
  enabledRoles: ["student", "coach"],
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  goal: "Hipertrofia",
  matricula: "GF-84920",
  cref: "08412-SP",
  specialty: "Hipertrofia & Biomecânica",
  bio: "Personal Trainer e atleta amador. Acredito na periodização científica e no acompanhamento individualizado com biomecânica refinada.",
  hourlyRate: 35,
  instagram: "@rodrigo.gymflow",
  location: "Salão Principal • Musculação & Área Funcional",
  pricing: {
    basicMonthly: 35,
    proMonthly: 45,
    vipMonthly: 55,
    dailySession: 35,
    weeklyPlan: 45,
    monthlyPlan: 55,
  },
};

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
    // Garante que o papel ativo sempre esteja na lista de papéis habilitados
    enabledRoles: Array.from(new Set([...current.enabledRoles, ...(updated.enabledRoles || [current.activeRole])])),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_CHANGED, { detail: merged }));
  }

  return merged;
}

export function switchUserRole(newRole: UserRole): UserProfile {
  const current = getCurrentUser();
  const enabledRoles = current.enabledRoles.includes(newRole)
    ? current.enabledRoles
    : [...current.enabledRoles, newRole];

  const updated: UserProfile = {
    ...current,
    activeRole: newRole,
    enabledRoles,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_CHANGED, { detail: updated }));
  }

  return updated;
}

export function registerNewUser(data: {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  cref?: string;
  specialty?: string;
  goal?: UserProfile["goal"];
}): UserProfile {
  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    name: data.name,
    email: data.email,
    phone: data.phone || "11987654321",
    activeRole: data.role,
    // Ao cadastrar, já habilita a flexibilidade de poder alternar para o outro modo quando desejar!
    enabledRoles: ["student", "coach"],
    matricula: `GF-${Math.floor(10000 + Math.random() * 90000)}`,
    goal: data.goal || "Hipertrofia",
    cref: data.cref?.trim() || undefined,
    specialty: data.specialty || (data.role === "coach" ? "Musculação & Hipertrofia" : undefined),
    bio: data.role === "coach" ? "Treinador especialista em performance e técnica perfeita." : undefined,
    hourlyRate: data.role === "coach" ? 70 : undefined,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newUser));
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_CHANGED, { detail: newUser }));
  }

  return newUser;
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
