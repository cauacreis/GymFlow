import { NextRequest, NextResponse } from "next/server";
import { isValidCoordinate, BRAZIL_STATES, ReverseGeocodeResult } from "@/lib/geo";

export const dynamic = "force-dynamic";

/**
 * Endpoint de geocodificação reversa para autocompletar cidade, estado e bairro a partir de coordenadas GPS.
 * Utiliza BigDataCloud com fallback para OpenStreetMap Nominatim no servidor.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    if (!latParam || !lngParam) {
      return NextResponse.json(
        { ok: false, error: "Parâmetros 'lat' e 'lng' são obrigatórios." },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    if (!isValidCoordinate(lat, lng)) {
      return NextResponse.json(
        { ok: false, error: "Coordenadas geográficas inválidas." },
        { status: 400 }
      );
    }

    let result: ReverseGeocodeResult | null = null;

    // 1. Primeira tentativa: BigDataCloud Reverse Geocoding (Rápido e Preciso para cidades brasileiras)
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`;
      const bdcRes = await fetch(bdcUrl, {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });

      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const adminList = Array.isArray(bdcData.localityInfo?.administrative)
          ? bdcData.localityInfo.administrative
          : [];

        // Identifica cidade pelo adminLevel 8 (município) ou 7
        const municipalObj =
          adminList.find((a: any) => a.adminLevel === 8) ||
          adminList.find((a: any) => a.adminLevel === 7);

        let city = municipalObj?.name || "";
        if (!city && bdcData.city && !bdcData.city.startsWith("Região")) {
          city = bdcData.city;
        }
        if (!city && bdcData.locality) {
          city = bdcData.locality;
        }

        // Identifica estado UF
        let state = (bdcData.principalSubdivisionCode || "").replace("BR-", "").toUpperCase();
        if (!state && bdcData.principalSubdivision) {
          const match = BRAZIL_STATES.find(
            (s) =>
              s.name.toLowerCase() === bdcData.principalSubdivision.toLowerCase() ||
              s.uf.toLowerCase() === bdcData.principalSubdivision.toLowerCase()
          );
          if (match) state = match.uf;
        }

        // Bairro / Localidade
        let neighborhood = "";
        if (bdcData.locality && bdcData.locality !== city) {
          neighborhood = bdcData.locality;
        }

        if (city || state) {
          result = {
            city: city ? city.trim() : undefined,
            state: state ? state.trim().slice(0, 2) : undefined,
            neighborhood: neighborhood ? neighborhood.trim() : undefined,
            displayName: [neighborhood, city, state].filter(Boolean).join(", "),
          };
        }
      }
    } catch (bdcErr) {
      console.warn("⚠️ [Geo API] Falha na consulta BigDataCloud:", bdcErr);
    }

    // 2. Segunda tentativa / Enriquecimento de bairro: OpenStreetMap Nominatim Server-Side
    if (!result || !result.neighborhood || !result.city) {
      try {
        const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt-BR`;
        const osmRes = await fetch(osmUrl, {
          headers: {
            "User-Agent": "GymFlow-FitnessApp/1.0 (contato@gymflow.com.br)",
            Accept: "application/json",
          },
          next: { revalidate: 86400 },
        });

        if (osmRes.ok) {
          const osmData = await osmRes.json();
          const addr = osmData?.address || {};

          const osmCity =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.village ||
            addr.county ||
            "";

          let osmState = "";
          if (addr["ISO3166-2-lvl4"]) {
            osmState = addr["ISO3166-2-lvl4"].replace("BR-", "").toUpperCase();
          } else if (addr.state) {
            const match = BRAZIL_STATES.find(
              (s) => s.name.toLowerCase() === addr.state.toLowerCase()
            );
            osmState = match ? match.uf : addr.state.slice(0, 2).toUpperCase();
          }

          const osmNeighborhood =
            addr.suburb ||
            addr.neighbourhood ||
            addr.quarter ||
            addr.city_district ||
            "";

          result = {
            city: (result?.city || osmCity || "").trim() || undefined,
            state: (result?.state || osmState || "").trim().slice(0, 2) || undefined,
            neighborhood: (osmNeighborhood || result?.neighborhood || "").trim() || undefined,
            displayName: osmData.display_name || result?.displayName,
          };
        }
      } catch (osmErr) {
        console.warn("⚠️ [Geo API] Falha na consulta Nominatim:", osmErr);
      }
    }

    if (!result) {
      return NextResponse.json(
        { ok: false, message: "Não foi possível determinar a localidade para estas coordenadas." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, data: result },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ [Geo API] Erro interno:", error);
    return NextResponse.json(
      { ok: false, error: "Erro interno no processamento da geolocalização." },
      { status: 500 }
    );
  }
}
