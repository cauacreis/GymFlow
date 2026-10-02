/**
 * Utilitário de Feedback Háptico e Tátil para Dispositivos Móveis
 * Respeita a preferência de acessibilidade/vibração configurada pelo usuário.
 */

import { getWorkoutPreferences } from "./privacy-service";

export type HapticFeedbackType = "light" | "medium" | "heavy" | "success" | "selection" | "warning";

export function triggerHaptic(type: HapticFeedbackType = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    const prefs = getWorkoutPreferences();
    if (!prefs.hapticFeedbackEnabled) {
      return; // Usuário desativou feedback tátil nas configurações
    }

    switch (type) {
      case "selection":
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "heavy":
        navigator.vibrate(45);
        break;
      case "success":
        navigator.vibrate([15, 60, 25]);
        break;
      case "warning":
        navigator.vibrate([30, 40, 30]);
        break;
    }
  } catch (e) {
    // Ignora silenciosamente em navegadores sem permissão de vibração
  }
}
