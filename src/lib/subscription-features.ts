/**
 * GymFlow Subscription & Feature Gating Engine
 * Centraliza o controle de acesso granular por plano (Básico, Pro, VIP) e estado (Trial, Ativo, Expirado)
 */

import { UserProfile, getCurrentUser, isUserAuthenticated } from "./auth-store";

export type PlanTier = "basico" | "pro" | "vip";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "expired"
  | "pending_choice";

export type FeatureKey =
  | "basic_workout"
  | "advanced_workout"
  | "turnstile_checkin"
  | "basic_agenda"
  | "collective_classes"
  | "gymbot_ai"
  | "personal_marketplace"
  | "vip_personal_perks"
  | "inbody_bioimpedance"
  | "coach_tools";

export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  requiredPlan?: PlanTier;
  isExpired?: boolean;
}

export interface PlanFeatureDetails {
  name: string;
  description: string;
  badge?: string;
  minTier: PlanTier;
}

export const FEATURES_METADATA: Record<FeatureKey, PlanFeatureDetails> = {
  basic_workout: {
    name: "Musculação & Aeróbico Básico",
    description: "Acesso às rotinas essenciais de treino para academia e em casa.",
    minTier: "basico",
  },
  advanced_workout: {
    name: "Fichas Avançadas com GIFs e Biomecânica",
    description: "Animações em tempo real, dicas de pegada e guia de execução postural.",
    badge: "PRO",
    minTier: "pro",
  },
  turnstile_checkin: {
    name: "Catraca Digital QR Code",
    description: "Liberação instantânea do acesso na portaria da academia via token dinâmico.",
    minTier: "basico",
  },
  basic_agenda: {
    name: "Agenda de Treinos",
    description: "Controle de presenças, faltas e histórico de treinos realizados.",
    minTier: "basico",
  },
  collective_classes: {
    name: "Aulas Coletivas Completas",
    description: "Spinning Indoor, Muay Thai, Cross Training WOD, Funcional e Alongamento.",
    badge: "PRO & VIP",
    minTier: "pro",
  },
  gymbot_ai: {
    name: "GymBot IA & Nutricionista Esportiva",
    description: "Tire dúvidas 24/7 sobre substituição de exercícios, cálculo de macros e periodização.",
    badge: "PRO & VIP",
    minTier: "pro",
  },
  personal_marketplace: {
    name: "Marketplace de Personal Trainers",
    description: "Encontre os melhores treinadores e contrate acompanhamento presencial.",
    minTier: "basico",
  },
  vip_personal_perks: {
    name: "Acompanhamento VIP com Personal Trainer",
    description: "Aulas com Personal inclusas, remanejamento flexível prioritário e convite para 1 amigo.",
    badge: "VIP",
    minTier: "vip",
  },
  inbody_bioimpedance: {
    name: "Bioimpedância InBody Mensal Gratuita",
    description: "Métricas avançadas de massa magra segmentada, água intra/extracelular e taxa metabólica.",
    badge: "VIP",
    minTier: "vip",
  },
  coach_tools: {
    name: "Painel do Treinador",
    description: "Gestão de alunos, prescrição de fichas e controle financeiro de personals.",
    badge: "COACH",
    minTier: "pro",
  },
};

const TIER_ORDER: Record<PlanTier, number> = {
  basico: 1,
  pro: 2,
  vip: 3,
};

/**
 * Retorna o plano do usuário normalizado
 */
export function getUserPlanTier(user?: UserProfile): PlanTier {
  const u = user || getCurrentUser();
  if (u.planTier && ["basico", "pro", "vip"].includes(u.planTier)) {
    return u.planTier;
  }
  if (u.subscriptionPlan?.includes("vip") || u.subscriptionPlan?.includes("annual")) {
    return "vip";
  }
  if (u.subscriptionPlan?.includes("basico")) {
    return "basico";
  }
  // Durante o Trial ou planos Pro padrão, concede tier 'pro'
  return "pro";
}

/**
 * Checa se a assinatura ou período de teste expirou
 */
export function isSubscriptionExpired(user?: UserProfile): boolean {
  const u = user || getCurrentUser();
  if (u.activeRole === "coach") return false;

  const status = u.subscriptionStatus;
  if (!status || status === "pending_choice" || status === "expired" || status === "past_due") {
    return true;
  }

  const now = Date.now();

  if (status === "trial") {
    if (!u.trialEndsAt) return false;
    return new Date(u.trialEndsAt).getTime() <= now;
  }

  if (status === "active") {
    if (!u.subscriptionEndsAt) return false;
    return new Date(u.subscriptionEndsAt).getTime() <= now;
  }

  return false;
}

/**
 * Retorna os dias restantes de teste grátis (0 se expirado)
 */
export function getRemainingTrialDays(user?: UserProfile): number {
  const u = user || getCurrentUser();
  if (u.subscriptionStatus !== "trial" || !u.trialEndsAt) return 0;
  const diffMs = new Date(u.trialEndsAt).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Avalia se o usuário tem permissão para usar uma funcionalidade específica
 */
export function canAccessFeature(
  feature: FeatureKey,
  user?: UserProfile
): FeatureAccessResult {
  const u = user || getCurrentUser();

  // Ferramentas de professor requerem o modo coach ativo
  if (feature === "coach_tools") {
    if (u.activeRole === "coach") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Esta funcionalidade é exclusiva para contas de Professor / Treinador.",
    };
  }

  // Treinadores têm acesso irrestrito para demonstrar aos alunos
  if (u.activeRole === "coach") {
    return { allowed: true };
  }

  // Verifica se o usuário está logado
  if (!isUserAuthenticated(u)) {
    return {
      allowed: false,
      reason: "Faça login ou cadastre-se para acessar esta funcionalidade.",
      isExpired: true,
    };
  }

  // Verifica se a assinatura está expirada
  if (isSubscriptionExpired(u)) {
    return {
      allowed: false,
      reason: "Sua assinatura ou período de teste expirou. Renove seu plano para continuar.",
      isExpired: true,
    };
  }

  // Se o aluno está em período de Trial ativo, liberamos funcionalidades até Pro
  if (u.subscriptionStatus === "trial") {
    const meta = FEATURES_METADATA[feature];
    if (meta.minTier === "vip") {
      return {
        allowed: false,
        reason: "Esta funcionalidade é exclusiva para assinantes do Plano VIP.",
        requiredPlan: "vip",
      };
    }
    return { allowed: true };
  }

  // Checagem de Nível de Plano (Básico vs Pro vs VIP)
  const userTier = getUserPlanTier(u);
  const requiredTier = FEATURES_METADATA[feature].minTier;

  if (TIER_ORDER[userTier] >= TIER_ORDER[requiredTier]) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Esta funcionalidade requer o ${FEATURES_METADATA[feature].badge || requiredTier.toUpperCase()}. Seu plano atual é ${userTier.toUpperCase()}.`,
    requiredPlan: requiredTier,
  };
}
