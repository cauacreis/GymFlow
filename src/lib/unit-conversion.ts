/**
 * GymFlow Unit Conversion Service
 * Fornece conversão dinâmica de unidades (Métrico kg/km vs Imperial lb/mi)
 * respeitando a preferência configurada pelo usuário em Ajustes > Preferências de Treino.
 */

import { getWorkoutPreferences } from "./privacy-service";

export function getEffectiveWeightUnit(): "kg" | "lb" {
  if (typeof window === "undefined") return "kg";
  try {
    return getWorkoutPreferences().weightUnit || "kg";
  } catch {
    return "kg";
  }
}

export function getEffectiveDistanceUnit(): "km" | "mi" {
  if (typeof window === "undefined") return "km";
  try {
    return getWorkoutPreferences().distanceUnit || "km";
  } catch {
    return "km";
  }
}

/**
 * Converte e formata peso em kg para a unidade de preferência (kg ou lb)
 */
export function formatWeight(valInKg: number, forcedUnit?: "kg" | "lb"): string {
  const unit = forcedUnit || getEffectiveWeightUnit();
  if (unit === "lb") {
    const valInLb = valInKg * 2.20462;
    return `${valInLb.toFixed(1).replace(".", ",")} lb`;
  }
  return `${valInKg.toFixed(1).replace(".", ",")} kg`;
}

/**
 * Converte e formata distância em km para a unidade de preferência (km ou mi)
 */
export function formatDistance(valInKm: number, forcedUnit?: "km" | "mi"): string {
  const unit = forcedUnit || getEffectiveDistanceUnit();
  if (unit === "mi") {
    const valInMi = valInKm * 0.621371;
    return `${valInMi.toFixed(2).replace(".", ",")} mi`;
  }
  return `${valInKm.toFixed(2).replace(".", ",")} km`;
}
