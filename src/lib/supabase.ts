import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Retorna true se as credenciais do Supabase estiverem devidamente configuradas no ambiente (.env.local ou Vercel)
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    supabaseAnonKey !== "your-anon-key" &&
    !supabaseUrl.includes("placeholder")
  );
};

/**
 * Retorna a URL de redirecionamento para o fluxo OAuth compatível com ambiente local e produção
 */
export const getAuthRedirectUrl = (subpath: string = "/auth/callback"): string => {
  if (typeof window !== "undefined" && window.location.origin) {
    return `${window.location.origin}${subpath}`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gymflow-weld.vercel.app";
  return `${appUrl.replace(/\/$/, "")}${subpath}`;
};

/**
 * Adaptador de armazenamento híbrido (localStorage + Cookie) para o Supabase Auth no navegador.
 * Permite que o PKCE code verifier e tokens de sessão sejam transmitidos ao Route Handler de callback (/auth/callback).
 */
const createBrowserStorageAdapter = () => {
  if (typeof window === "undefined") return undefined;

  return {
    getItem: (key: string): string | null => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) return item;
      } catch {}

      if (typeof document !== "undefined") {
        const match = document.cookie.match(new RegExp("(?:^|; )" + key.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
        if (match) {
          try {
            return decodeURIComponent(match[1]);
          } catch {
            return match[1];
          }
        }
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      try {
        window.localStorage.setItem(key, value);
      } catch {}

      if (typeof document !== "undefined") {
        const isHttps = window.location.protocol === "https:";
        document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax${isHttps ? "; Secure" : ""}`;
      }
    },
    removeItem: (key: string): void => {
      try {
        window.localStorage.removeItem(key);
      } catch {}

      if (typeof document !== "undefined") {
        const isHttps = window.location.protocol === "https:";
        document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax${isHttps ? "; Secure" : ""}`;
      }
    },
  };
};

// Cliente Singleton do Supabase
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    const storage = createBrowserStorageAdapter();
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        ...(storage ? { storage } : {}),
      },
    });
  }

  return supabaseInstance;
};

/**
 * Cliente administrativo com service_role para Webhooks e Rotas de Servidor
 */
export const getSupabaseAdmin = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseAdminInstance) {
    const key = supabaseServiceRoleKey || supabaseAnonKey;
    supabaseAdminInstance = createClient(supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdminInstance;
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        ...(typeof window !== "undefined" ? { storage: createBrowserStorageAdapter() } : {}),
      },
    })
  : (null as unknown as SupabaseClient);
