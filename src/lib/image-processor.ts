/**
 * Utilitários de Processamento, Validação e Compressão Segura de Imagens
 * GymFlow Security Shield - Prevenção contra Stored XSS, Polyglot Files e Otimização WebP
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  format?: "jpeg" | "png" | "webp";
  sanitizedFilename?: string;
}

export interface CompressedImageResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  format: "webp" | "jpeg";
  compressionRatio: number; // Porcentagem de redução (ex: 85%)
}

const MAX_RAW_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
];

// Assinaturas canônicas de Magic Bytes
const MAGIC_BYTES = {
  JPEG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  WEBP_HEADER: [0x57, 0x45, 0x42, 0x50], // "WEBP"
};

/**
 * Validação rigorosa de arquivo de imagem antes de qualquer processamento:
 * 1. Tamanho máximo (5MB)
 * 2. MIME type declarado (com tolerância a mimes vazios se os magic bytes forem autênticos)
 * 3. Inspeção de Magic Bytes do cabeçalho binário (previne extensão falsa)
 * 4. Scan binário aprofundado (até 8KB) contra scripts embutidos (SVG/HTML polyglots)
 */
export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  // 1. Limite de tamanho de arquivo
  if (!file || file.size === 0) {
    return { valid: false, error: "Arquivo de imagem vazio ou não selecionado." };
  }

  if (file.size > MAX_RAW_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `A imagem selecionada possui ${sizeInMb}MB. O limite máximo permitido é de 5MB.`,
    };
  }

  // 2. MIME Type informado
  const normalizedMime = (file.type || "").toLowerCase().trim();
  if (normalizedMime && !ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return {
      valid: false,
      error: "Formato de imagem não suportado. Utilize apenas fotos nos formatos JPG, PNG ou WebP.",
    };
  }

  // 3. Inspeção de Magic Bytes (leitura binária dos primeiros 16 bytes)
  try {
    const headerBuffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);

    let detectedFormat: "jpeg" | "png" | "webp" | null = null;

    // Checa JPEG
    if (
      bytes.length >= 3 &&
      bytes[0] === MAGIC_BYTES.JPEG[0] &&
      bytes[1] === MAGIC_BYTES.JPEG[1] &&
      bytes[2] === MAGIC_BYTES.JPEG[2]
    ) {
      detectedFormat = "jpeg";
    }
    // Checa PNG
    else if (
      bytes.length >= 8 &&
      MAGIC_BYTES.PNG.every((val, idx) => bytes[idx] === val)
    ) {
      detectedFormat = "png";
    }
    // Checa WebP: RIFF em 0..3 e WEBP em 8..11
    else if (
      bytes.length >= 12 &&
      MAGIC_BYTES.WEBP_RIFF.every((val, idx) => bytes[idx] === val) &&
      MAGIC_BYTES.WEBP_HEADER.every((val, idx) => bytes[idx + 8] === val)
    ) {
      detectedFormat = "webp";
    }

    if (!detectedFormat) {
      return {
        valid: false,
        error: "Assinatura do arquivo inválida. O arquivo parece corrompido ou não é uma imagem real.",
      };
    }

    // 4. Scan contra Polyglot / Injeção de Tags maliciosas (Stored XSS)
    // Lê até os primeiros 8192 bytes procurando tags executáveis disfarçadas
    const scanSize = Math.min(file.size, 8192);
    const textSampleBuffer = await file.slice(0, scanSize).arrayBuffer();
    const textDecoder = new TextDecoder("utf-8", { fatal: false });
    const textSample = textDecoder.decode(textSampleBuffer).toLowerCase();

    const dangerousPatterns = [
      "<svg",
      "<?xml",
      "<!doctype",
      "<script",
      "<html",
      "<body",
      "<iframe",
      "onload=",
      "onerror=",
      "javascript:",
      "expression(",
      "data:text/html",
    ];

    for (const pattern of dangerousPatterns) {
      if (textSample.includes(pattern)) {
        return {
          valid: false,
          error: "O arquivo contém conteúdo ou scripts maliciosos embutidos e foi bloqueado por segurança.",
        };
      }
    }

    return {
      valid: true,
      format: detectedFormat,
      sanitizedFilename: (file.name || "avatar").replace(/[^a-zA-Z0-9._-]/g, "_"),
    };
  } catch {
    return {
      valid: false,
      error: "Falha ao inspecionar cabeçalho binário da imagem. Tente outro arquivo.",
    };
  }
}

/**
 * Re-renderiza e comprime a imagem usando a Canvas API para WebP no navegador.
 * Este processo desintegra metadados EXIF maliciosos, anula polyglots e
 * reduz fotos de 3-5MB para ~20-40KB, preservando alta fidelidade visual.
 */
export async function processAndCompressImageToWebP(
  file: File,
  options?: {
    maxDimension?: number;
    quality?: number;
  }
): Promise<CompressedImageResult> {
  const maxDim = options?.maxDimension || 400;
  const quality = options?.quality ?? 0.82;

  // 1. Validação prévia de integridade binária
  const validation = await validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Imagem inválida.");
  }

  // 2. Carrega a imagem com segurança em um objeto Image
  const objectUrl = URL.createObjectURL(file);

  return new Promise<CompressedImageResult>((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          throw new Error("Dimensões de imagem inválidas.");
        }

        // Defesa contra Pixel Flood / Image Decompression Bomb (limite de 16 Megapixels / 8192px)
        if (width > 8192 || height > 8192 || (width * height) > 16777216) {
          throw new Error("A resolução da imagem excede os limites de segurança permitidos (máx 16 Megapixels).");
        }

        // Calcula proporção para não ultrapassar maxDim (mantém aspect ratio)
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        // 3. Renderiza no Canvas offscreen
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) {
          throw new Error("Não foi possível inicializar o motor de renderização da imagem.");
        }

        // Suavização bilinear de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // 4. Converte para WebP (com fallback defensivo para JPEG caso navegador seja arcaico)
        let format: "webp" | "jpeg" = "webp";
        let dataUrl = canvas.toDataURL("image/webp", quality);

        if (!dataUrl.startsWith("data:image/webp")) {
          // Fallback caso o navegador não suporte exportação WebP em canvas
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          format = "jpeg";
        }

        if (!dataUrl || !dataUrl.startsWith("data:image/")) {
          throw new Error("Falha na geração do arquivo WebP comprimido.");
        }

        // Estima o tamanho comprimido em bytes a partir do Base64
        const base64Data = dataUrl.split(",")[1] || "";
        const compressedSize = Math.round((base64Data.length * 3) / 4);
        const originalSize = file.size;

        const reduction = originalSize > 0
          ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
          : 0;

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          width,
          height,
          format,
          compressionRatio: reduction,
        });
      } catch (err: any) {
        reject(new Error(err?.message || "Falha na conversão e compressão da imagem."));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Falha ao decodificar a imagem selecionada."));
    };

    img.src = objectUrl;
  });
}
