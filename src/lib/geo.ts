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
 * com timeout estrito de 3.5 segundos e fallback silencioso.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  if (!isValidCoordinate(lat, lng)) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt-BR`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GymFlow-FitnessApp/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const address = data?.address;
    if (!address) return null;

    // Extração inteligente de cidade
    const city =
      address.city ||
      address.town ||
      address.municipality ||
      address.village ||
      address.county ||
      "";

    // Extração de estado (UF)
    let state = "";
    if (address["ISO3166-2-lvl4"]) {
      state = address["ISO3166-2-lvl4"].replace("BR-", "").toUpperCase();
    } else if (address.state) {
      const match = BRAZIL_STATES.find(
        (s) => s.name.toLowerCase() === address.state.toLowerCase()
      );
      state = match ? match.uf : address.state.slice(0, 2).toUpperCase();
    }

    // Extração de bairro / região
    const neighborhood =
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.city_district ||
      "";

    return {
      city: city ? city.trim() : undefined,
      state: state ? state.trim() : undefined,
      neighborhood: neighborhood ? neighborhood.trim() : undefined,
      displayName: data.display_name,
    };
  } catch {
    // Falhas de rede ou timeout não quebram o fluxo do usuário
    return null;
  }
}
