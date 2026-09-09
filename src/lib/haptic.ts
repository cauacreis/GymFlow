/**
 * Utilitário de Feedback Háptico e Tátil para Dispositivos Móveis
 */

export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" = "light") {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      switch (type) {
        case "light":
          navigator.vibrate(12);
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
      }
    } catch (e) {
      // Ignora silenciosamente em navegadores sem permissão de vibração
    }
  }
}
