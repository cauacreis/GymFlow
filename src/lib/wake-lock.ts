/**
 * GymFlow Screen Wake Lock Service
 * Mantém a tela do celular/computador ativa durante a execução de treinos e cronômetros de descanso.
 * Respeita a preferência 'keepScreenAwakeDuringWorkout' configurada em Ajustes > Preferências.
 */

import { getWorkoutPreferences } from "./privacy-service";

let activeWakeLock: any = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof window === "undefined" || !("wakeLock" in navigator)) {
    return false;
  }

  try {
    const prefs = getWorkoutPreferences();
    if (!prefs.keepScreenAwakeDuringWorkout) {
      return false; // Usuário optou por não manter a tela ativa
    }

    if (!activeWakeLock || activeWakeLock.released) {
      activeWakeLock = await (navigator as any).wakeLock.request("screen");
      activeWakeLock.addEventListener("release", () => {
        activeWakeLock = null;
      });
    }
    return true;
  } catch {
    // Ignora se o dispositivo estiver em modo de economia extrema de bateria
    return false;
  }
}

export async function releaseScreenWakeLock(): Promise<void> {
  if (activeWakeLock && !activeWakeLock.released) {
    try {
      await activeWakeLock.release();
    } catch {}
    activeWakeLock = null;
  }
}
