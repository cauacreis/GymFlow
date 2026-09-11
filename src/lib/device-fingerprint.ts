/**
 * GymFlow Device Fingerprint Engine
 * Identificação determinística de hardware, tela e navegador para proteção anti-abuso.
 * Implementa persistência em multicamadas (localStorage + sessionStorage + Cookie persistente).
 */

// Gera hash SHA-256 no browser ou fallback seguro
async function sha256(message: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback FNV-1a se crypto.subtle não estiver disponível
  let hash = 2166136261;
  for (let i = 0; i < message.length; i++) {
    hash ^= message.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fp_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

// Canvas Fingerprint: desenha formas e gradientes para extrair características únicas da GPU/renderizador
function getCanvasFingerprint(): string {
  try {
    if (typeof document === "undefined") return "no_canvas";
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no_context";

    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("GymFlow,SecureDevice2026!#$", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("GymFlow,SecureDevice2026!#$", 4, 17);

    return canvas.toDataURL();
  } catch {
    return "canvas_error";
  }
}

// WebGL Fingerprint: identifica modelo da placa de vídeo
function getWebGLFingerprint(): string {
  try {
    if (typeof document === "undefined") return "no_webgl";
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || (canvas.getContext("experimental-webgl") as any);
    if (!gl) return "no_gl_context";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "no_debug_info";

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
    return `${vendor}~${renderer}`;
  } catch {
    return "webgl_error";
  }
}

const COOKIE_NAME = "gymflow_did";
const STORAGE_KEY = "gymflow_device_fingerprint_v2";

// Helper para ler cookie
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

// Helper para salvar cookie persistente (1 ano)
function setCookie(name: string, val: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365; // 365 dias
  document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Coleta atributos do dispositivo e gera um identificador único estável
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server_device_env";

  // 1. Tenta recuperar das camadas de persistência já existentes
  const existingCookie = getCookie(COOKIE_NAME);
  const existingStorage = localStorage.getItem(STORAGE_KEY);
  const existingSession = sessionStorage.getItem(STORAGE_KEY);

  // Se já existe em qualquer camada, garante sincronia entre todas
  const cachedId = existingCookie || existingStorage || existingSession;
  if (cachedId && cachedId.startsWith("dev_")) {
    if (!existingStorage) localStorage.setItem(STORAGE_KEY, cachedId);
    if (!existingSession) sessionStorage.setItem(STORAGE_KEY, cachedId);
    if (!existingCookie) setCookie(COOKIE_NAME, cachedId);
    return cachedId;
  }

  // 2. Coleta métricas de hardware, tela e ambiente
  const nav = window.navigator as any;
  const screen = window.screen;

  const components = [
    screen.width,
    screen.height,
    screen.colorDepth,
    screen.pixelDepth,
    window.devicePixelRatio || 1,
    nav.hardwareConcurrency || 2,
    nav.deviceMemory || 4,
    nav.platform || "unknown_platform",
    nav.userAgent || "",
    nav.language || "pt-BR",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
    getCanvasFingerprint(),
    getWebGLFingerprint(),
  ];

  const rawString = components.join("###");
  const hash = await sha256(rawString);
  const deviceId = `dev_${hash.slice(0, 24)}`;

  // Salva em todas as 3 camadas de persistência
  try {
    localStorage.setItem(STORAGE_KEY, deviceId);
    sessionStorage.setItem(STORAGE_KEY, deviceId);
    setCookie(COOKIE_NAME, deviceId);
  } catch (err) {
    console.warn("Aviso ao persistir fingerprint do dispositivo:", err);
  }

  return deviceId;
}
