import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") || "/";
  const roleParam = requestUrl.searchParams.get("role");
  const flowId = requestUrl.searchParams.get("sb_flow_id") || undefined;
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  const origin = requestUrl.origin;

  // 🛡️ Prevenção contra Open Redirect (CWE-601): Permite estritamente caminhos relativos internos seguros
  const isSafeRelativePath =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.startsWith("/\\") &&
    !rawNext.includes("://");
  const next = isSafeRelativePath ? rawNext : "/";

  // Trata erro retornado pelo provedor OAuth (ex: usuário cancelou login no Google)
  if (error) {
    console.error("❌ [OAuth Callback] Erro retornado pelo provedor:", error, errorDescription);
    const redirectUrl = new URL("/", origin);
    redirectUrl.searchParams.set("auth_error", errorDescription || error);
    return NextResponse.redirect(redirectUrl.toString());
  }

  // Se não houver código de autorização, redireciona para a rota segura
  if (!code) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

  if (!isSupabaseConfigured()) {
    const fallbackUrl = new URL(next, origin);
    fallbackUrl.searchParams.set("code", code);
    return NextResponse.redirect(fallbackUrl.toString());
  }

  // Extrai cookies com proteção contra sequências malformadas de URI
  const cookieHeader = request.headers.get("cookie") || "";
  const parsedCookies: Record<string, string> = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((c) => {
      const [key, ...v] = c.trim().split("=");
      if (key) {
        const rawVal = v.join("=");
        try {
          parsedCookies[key] = decodeURIComponent(rawVal);
        } catch {
          parsedCookies[key] = rawVal;
        }
      }
    });
  }

  // Adaptador de storage server-side com Map deduplicado
  const cookiesToSetMap = new Map<string, { value: string; options?: any }>();
  const serverStorage = {
    getItem: (key: string) => parsedCookies[key] || null,
    setItem: (key: string, value: string) => {
      parsedCookies[key] = value;
      cookiesToSetMap.set(key, { value });
    },
    removeItem: (key: string) => {
      delete parsedCookies[key];
      cookiesToSetMap.set(key, { value: "", options: { maxAge: 0 } });
    },
  };

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: serverStorage,
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // Suporta troca de PKCE padrão e slot-based com flowId
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    );

    if (exchangeError || !data?.session) {
      console.warn("⚠️ [OAuth Callback] Falha na troca server-side:", exchangeError?.message);
      // Fallback gracioso: repassa o code via URL para o cliente resolver via browser localStorage/PKCE
      const fallbackUrl = new URL(next, origin);
      fallbackUrl.searchParams.set("code", code);
      return NextResponse.redirect(fallbackUrl.toString());
    }

    const { user } = data;

    // Se o usuário foi autenticado, sincroniza perfil na tabela 'profiles'
    if (user) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const meta = user.user_metadata || {};
      let fullName = user.email?.split("@")[0] || "Usuário";
      if (typeof meta.full_name === "string" && meta.full_name.trim()) {
        fullName = meta.full_name.trim();
      } else if (typeof meta.name === "string" && meta.name.trim()) {
        fullName = meta.name.trim();
      } else if (meta.full_name && typeof meta.full_name === "object") {
        const parts = [meta.full_name.firstName, meta.full_name.lastName].filter(Boolean);
        if (parts.length > 0) fullName = parts.join(" ");
      } else if (meta.name && typeof meta.name === "object") {
        const parts = [meta.name.firstName, meta.name.lastName].filter(Boolean);
        if (parts.length > 0) fullName = parts.join(" ");
      }

      const avatarUrl = meta.avatar_url || meta.picture || null;
      const cookieRole = parsedCookies["gymflow_oauth_role"];
      const rawRole = roleParam || cookieRole;
      const explicitRole = rawRole && (rawRole === "coach" || rawRole === "student") ? rawRole : null;
      const defaultRole = (meta.role || "student") as "student" | "coach";
      const finalRole = explicitRole || defaultRole;

      // Verifica se o perfil já existe na tabela 'profiles'
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id, active_role, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Cria perfil inicial caso seja novo cadastro via OAuth
        const { error: upsertErr } = await adminClient.from("profiles").upsert(
          {
            id: user.id,
            name: fullName,
            email: user.email || "",
            active_role: finalRole,
            enabled_roles: ["student", "coach"],
            avatar_url: avatarUrl,
            profile_completed: false,
            terms_accepted: false,
            subscription_status: finalRole === "coach" ? "active" : "pending_choice",
            subscription_plan: "trial_7d",
            plan_tier: "pro",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
        if (upsertErr) {
          console.error("❌ [OAuth Callback] Erro ao criar perfil inicial:", upsertErr.message);
        }
      } else {
        // Se o perfil já existe (ex: criado pelo trigger handle_new_user do Supabase ou login recorrente),
        // atualiza avatar caso ausente e sincroniza papel selecionado se fornecido explicitamente no cadastro
        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (!existingProfile.avatar_url && avatarUrl) {
          updates.avatar_url = avatarUrl;
        }
        if (explicitRole && explicitRole !== existingProfile.active_role) {
          updates.active_role = explicitRole;
          if (explicitRole === "coach") {
            updates.subscription_status = "active";
          }
        }
        if (Object.keys(updates).length > 1) {
          const { error: updateErr } = await adminClient.from("profiles").update(updates).eq("id", user.id);
          if (updateErr) {
            console.error("❌ [OAuth Callback] Erro ao atualizar perfil:", updateErr.message);
          }
        }
      }
    }

    // Prepara resposta com redirecionamento para o destino seguro
    const redirectResponse = NextResponse.redirect(new URL(next, origin));

    // Define cookie de sessão do GymFlow para o Middleware
    redirectResponse.cookies.set("gymflow_session", "active", {
      path: "/",
      maxAge: 2592000, // 30 dias
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Limpa cookie temporário de papel OAuth se presente
    if (parsedCookies["gymflow_oauth_role"]) {
      redirectResponse.cookies.set("gymflow_oauth_role", "", {
        path: "/",
        maxAge: 0,
      });
    }

    // Propaga os cookies de sessão do Supabase gerados durante o exchange sem duplicação
    for (const [cookieName, cookieItem] of cookiesToSetMap.entries()) {
      redirectResponse.cookies.set(cookieName, cookieItem.value, {
        path: "/",
        maxAge: cookieItem.options?.maxAge ?? 2592000,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return redirectResponse;
  } catch (err: any) {
    console.error("❌ [OAuth Callback] Erro inesperado:", err);
    // Em caso de exceção de rede, repassa code ao cliente
    const fallbackUrl = new URL(next, origin);
    fallbackUrl.searchParams.set("code", code);
    return NextResponse.redirect(fallbackUrl.toString());
  }
}
