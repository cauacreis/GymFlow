/**
 * GymFlow Geolocation & Proximity Services
 * Cálculo de distância via Fórmula de Haversine, validação de limites geográficos e proteção de privacidade.
 */

export interface BrazilState {
  uf: string;
  name: string;
  region: "Sudeste" | "Sul" | "Nordeste" | "Centro-Oeste" | "Norte";
}

export const BRAZIL_STATES: BrazilState[] = [
  { uf: "AC", name: "Acre", region: "Norte" },
  { uf: "AL", name: "Alagoas", region: "Nordeste" },
  { uf: "AP", name: "Amapá", region: "Norte" },
  { uf: "AM", name: "Amazonas", region: "Norte" },
  { uf: "BA", name: "Bahia", region: "Nordeste" },
  { uf: "CE", name: "Ceará", region: "Nordeste" },
  { uf: "DF", name: "Distrito Federal", region: "Centro-Oeste" },
  { uf: "ES", name: "Espírito Santo", region: "Sudeste" },
  { uf: "GO", name: "Goiás", region: "Centro-Oeste" },
  { uf: "MA", name: "Maranhão", region: "Nordeste" },
  { uf: "MT", name: "Mato Grosso", region: "Centro-Oeste" },
  { uf: "MS", name: "Mato Grosso do Sul", region: "Centro-Oeste" },
  { uf: "MG", name: "Minas Gerais", region: "Sudeste" },
  { uf: "PA", name: "Pará", region: "Norte" },
  { uf: "PB", name: "Paraíba", region: "Nordeste" },
  { uf: "PR", name: "Paraná", region: "Sul" },
  { uf: "PE", name: "Pernambuco", region: "Nordeste" },
  { uf: "PI", name: "Piauí", region: "Nordeste" },
  { uf: "RJ", name: "Rio de Janeiro", region: "Sudeste" },
  { uf: "RN", name: "Rio Grande do Norte", region: "Nordeste" },
  { uf: "RS", name: "Rio Grande do Sul", region: "Sul" },
  { uf: "RO", name: "Rondônia", region: "Norte" },
  { uf: "RR", name: "Roraima", region: "Norte" },
  { uf: "SC", name: "Santa Catarina", region: "Sul" },
  { uf: "SP", name: "São Paulo", region: "Sudeste" },
  { uf: "SE", name: "Sergipe", region: "Nordeste" },
  { uf: "TO", name: "Tocantins", region: "Norte" },
];

/**
 * Validação estrita de limites numéricos para latitude e longitude.
 * Previne injeções de NaN, Infinity ou coordenadas fora do globo terrestre.
 */
export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/**
 * Calcula a distância ortodrômica em quilômetros entre dois pontos na Terra
 * utilizando a Fórmula de Haversine com tratamento de domínios matemáticos.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number | null {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return null;
  }

  // Se são exatamente as mesmas coordenadas
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const EARTH_RADIUS_KM = 6371; // Raio médio da Terra

  const toRad = (degree: number) => (degree * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  // Fórmula de Haversine
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // Garante que o argumento de asin/atan2 esteja entre 0 e 1 (evita NaN por imprecisão de ponto flutuante)
  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  const distance = EARTH_RADIUS_KM * c;

  // Arredonda para 1 casa decimal (ex: 2.4 km)
  return Math.round(distance * 10) / 10;
}

/**
 * Formata a distância para exibição amigável ao usuário.
 * Ex: 350m para distâncias menores que 1 km, ou 2.4 km para distâncias maiores.
 */
export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined || Number.isNaN(km)) return "";
  if (km < 1) {
    const meters = Math.max(50, Math.round(km * 1000));
    return `${meters}m`;
  }
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export interface ReverseGeocodeResult {
  city?: string;
  state?: string;
  neighborhood?: string;
  displayName?: string;
}

/**
 * Consulta de geocodificação reversa defensiva (coordenadas -> cidade/estado/bairro)
 * com multi-provider fallback (API interna / BigDataCloud / OpenStreetMap).
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  if (!isValidCoordinate(lat, lng)) return null;

  // 1. Tenta endpoint interno do GymFlow (/api/geo/reverse)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const apiRes = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.ok && json.data) {
        return json.data as ReverseGeocodeResult;
      }
    }
  } catch {
    // Fallback silencioso para consulta client-side
  }

  // 2. Fallback direto via BigDataCloud client API (CORS liberado e sem restrições de headers)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`;
    const bdcRes = await fetch(bdcUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const adminList = Array.isArray(data.localityInfo?.administrative)
        ? data.localityInfo.administrative
        : [];

      const municipalObj =
        adminList.find((a: any) => a.adminLevel === 8) ||
        adminList.find((a: any) => a.adminLevel === 7);

      let city = municipalObj?.name || "";
      if (!city && data.city && !data.city.startsWith("Região")) {
        city = data.city;
      }
      if (!city && data.locality) {
        city = data.locality;
      }

      let state = (data.principalSubdivisionCode || "").replace("BR-", "").toUpperCase();
      if (!state && data.principalSubdivision) {
        const match = BRAZIL_STATES.find(
          (s) =>
            s.name.toLowerCase() === data.principalSubdivision.toLowerCase() ||
            s.uf.toLowerCase() === data.principalSubdivision.toLowerCase()
        );
        if (match) state = match.uf;
      }

      let neighborhood = "";
      if (data.locality && data.locality !== city) {
        neighborhood = data.locality;
      }

      const sanitizeText = (val: string) =>
        val ? val.replace(/<[^>]*>?/gm, "").replace(/["'`\\;]/g, "").trim() : "";

      const cleanCity = sanitizeText(city);
      const cleanState = sanitizeText(state).toUpperCase().slice(0, 2);
      const cleanNeighborhood = sanitizeText(neighborhood);

      if (cleanCity || cleanState) {
        return {
          city: cleanCity || undefined,
          state: cleanState || undefined,
          neighborhood: cleanNeighborhood || undefined,
          displayName: [cleanNeighborhood, cleanCity, cleanState].filter(Boolean).join(", "),
        };
      }
    }
  } catch {
    // Continua para o próximo fallback se houver falha de rede
  }

  return null;
}
