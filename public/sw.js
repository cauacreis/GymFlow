/**
 * Service Worker Seguro do GymFlow
 * Diretriz LGPD e Segurança: NUNCA armazenar dados sensíveis em cache.
 */

const CACHE_NAME = "gymflow-static-v1";

// Rotas sensíveis que NUNCA devem ser salvas em cache pelo Service Worker
const SENSITIVE_ROUTES = [
  "/api/",
  "/checkout",
  "/bag",
  "/profile",
  "/orders",
  "/auth",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Se for rota sensível ou requisição que não seja GET, ignore o cache
  if (
    event.request.method !== "GET" ||
    SENSITIVE_ROUTES.some((route) => url.pathname.startsWith(route))
  ) {
    return;
  }

  // Apenas arquivos estáticos seguros (imagens públicas, ícones, fontes)
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
