/**
 * Assistente Nutricional com IA Gratuita (GymBot AI)
 * Calcula taxa metabólica basal, gasto energético total e sugere o prato ideal sem custo de API externa.
 */

import { PRESET_MEALS, PresetMeal } from "./data";

export interface UserFitnessProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "moderate" | "intense" | "athlete";
  goal: "fat_loss" | "muscle_gain" | "maintenance";
  dietaryRestriction?: "none" | "vegan" | "gluten_free" | "lactose_free";
}

export interface RecommendationResult {
  bmr: number;
  tdee: number;
  targetDailyCalories: number;
  mealTargetCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  recommendedMeal: PresetMeal;
  rationale: string;
  actionTip: string;
}

export function generateNutritionPlan(
  profile: UserFitnessProfile
): RecommendationResult {
  // 1. Fórmula de Mifflin-St Jeor para Taxa Metabólica Basal (BMR)
  let bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  if (profile.gender === "male") {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // 2. Fator de Atividade
  const activityMultipliers = {
    sedentary: 1.2,
    moderate: 1.55,
    intense: 1.725,
    athlete: 1.9,
  };
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel]);

  // 3. Ajuste por Objetivo
  let targetDailyCalories = tdee;
  if (profile.goal === "fat_loss") {
    targetDailyCalories = Math.round(tdee - 450); // Déficit moderado sustentável
  } else if (profile.goal === "muscle_gain") {
    targetDailyCalories = Math.round(tdee + 350); // Superávit limpo
  }

  // Alocação por Refeição Principal (aprox. 30% a 35% do gasto diário)
  const mealTargetCalories = Math.round(targetDailyCalories * 0.32);

  // 4. Divisão de Macronutrientes para a Refeição
  let proteinPerMeal = Math.round(profile.weightKg * 0.55); // ~2.2g/kg/dia dividido em 4 refeições
  if (profile.goal === "fat_loss") proteinPerMeal = Math.max(40, proteinPerMeal);

  let recommendedMeal: PresetMeal;
  let rationale = "";
  let actionTip = "";

  if (profile.dietaryRestriction === "vegan") {
    recommendedMeal = PRESET_MEALS.find((m) => m.id === "meal-4")!;
    rationale = "Proteína vegetal limpa enriquecida com aminoácidos essenciais e gorduras benéficas do gergelim tostado.";
    actionTip = "Combine com hidratação de 45ml de água por kg de peso corporal.";
  } else if (profile.goal === "fat_loss") {
    recommendedMeal = PRESET_MEALS.find((m) => m.id === "meal-3")!;
    rationale = `Com 45g de proteína magra e apenas 410 kcal, você mantém o déficit calórico sem perder densidade muscular.`;
    actionTip = "Consuma esta refeição até 2h após seu treino de musculação.";
  } else if (profile.goal === "muscle_gain") {
    recommendedMeal = PRESET_MEALS.find((m) => m.id === "meal-2")!;
    rationale = `Com 52g de proteína nobre e carboidrato complexo de baixo índice glicêmico (batata doce), promove pico anabólico prolongado.`;
    actionTip = "Excelente como pré ou pós-treino pesado de pernas ou costas.";
  } else {
    recommendedMeal = PRESET_MEALS.find((m) => m.id === "meal-1")!;
    rationale = "Alto teor de ácidos graxos ômega 3 do salmão selvagem para modulação anti-inflamatória e longevidade.";
    actionTip = "Ideal para quem busca energia estável ao longo de todo o dia.";
  }

  return {
    bmr: Math.round(bmr),
    tdee,
    targetDailyCalories,
    mealTargetCalories,
    macros: {
      protein: recommendedMeal.protein,
      carbs: recommendedMeal.carbs,
      fat: recommendedMeal.fat,
    },
    recommendedMeal,
    rationale,
    actionTip,
  };
}
