import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { OFFICIAL_MOTO125_LOGO_SVG } from "./assets/logoSvg.js";


export type WatermarkPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "center";

export interface WatermarkOptions {
  enabled?: boolean;
  position?: WatermarkPosition;
  opacity?: number; // 0.1 a 1.0 (default: 0.85)
  scale?: number; // 0.05 a 0.5 (relativo al ancho de la imagen base, default: 0.18)
  margin?: number; // margen en píxeles (default: 20)
  customSvg?: string;
}

export interface WatermarkFileResult {
  originalPath: string;
  outputPath: string;
  width: number;
  height: number;
  sizeBytes: number;
}

function injectSvgOpacity(svg: string, opacity: number): string {
  if (opacity >= 1) return svg;
  return svg.replace(/<svg([^>]*)>([\s\S]*)<\/svg>/i, (_, attrs, inner) => {
    return `<svg${attrs}><g opacity="${opacity.toFixed(2)}">${inner}</g></svg>`;
  });
}

/**
 * Aplica la marca de agua a una imagen en memoria si se solicita explícitamente.
 * Por defecto NO se aplica a menos que options sea true o un objeto con enabled !== false.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  options?: boolean | WatermarkOptions
): Promise<Buffer> {
  // Si no se pide explícitamente, devolver el buffer intacto sin procesar
  if (!options) {
    return imageBuffer;
  }

  const opts: WatermarkOptions = typeof options === "object" ? options : {};
  if (opts.enabled === false) {
    return imageBuffer;
  }

  const position = opts.position ?? "bottom-right";
  const opacity = Math.min(Math.max(opts.opacity ?? 0.85, 0.05), 1);
  const scale = Math.min(Math.max(opts.scale ?? 0.18, 0.05), 0.6);

  const margin = Math.max(opts.margin ?? 20, 0);

  // Auto-rotar según EXIF para que las coordenadas de composición sean exactas
  const baseImage = sharp(imageBuffer).rotate();
  const metadata = await baseImage.metadata();

  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    return imageBuffer;
  }

  // Dimensiones proporcionales para el logo
  const watermarkWidth = Math.round(width * scale);
  if (watermarkWidth <= 0) return imageBuffer;

  let svgContent = OFFICIAL_MOTO125_LOGO_SVG;

  // Permitir sobreescribir con archivo local si está definido por env var
  const envCustomPath = process.env.MOTO125_WATERMARK_PATH;
  if (opts.customSvg) {
    svgContent = opts.customSvg;
  } else if (envCustomPath && fs.existsSync(envCustomPath)) {
    try {
      svgContent = fs.readFileSync(envCustomPath, "utf-8");
    } catch {
      // Fallback al logo oficial
    }
  }

  const preparedSvg = injectSvgOpacity(svgContent, opacity);

  const watermarkPngBuffer = await sharp(Buffer.from(preparedSvg))
    .resize({ width: watermarkWidth })
    .png()
    .toBuffer();

  const watermarkMeta = await sharp(watermarkPngBuffer).metadata();
  const watermarkHeight =
    watermarkMeta.height ?? Math.round(watermarkWidth * (119 / 514));

  let left = 0;
  let top = 0;

  switch (position) {
    case "bottom-right":
      left = Math.max(width - watermarkWidth - margin, 0);
      top = Math.max(height - watermarkHeight - margin, 0);
      break;
    case "bottom-left":
      left = margin;
      top = Math.max(height - watermarkHeight - margin, 0);
      break;
    case "top-right":
      left = Math.max(width - watermarkWidth - margin, 0);
      top = margin;
      break;
    case "top-left":
      left = margin;
      top = margin;
      break;
    case "center":
      left = Math.max(Math.round((width - watermarkWidth) / 2), 0);
      top = Math.max(Math.round((height - watermarkHeight) / 2), 0);
      break;
  }

  return baseImage
    .composite([
      {
        input: watermarkPngBuffer,
        top,
        left,
      },
    ])
    .toBuffer();
}

/**
 * Aplica la marca de agua a un fichero local en disco y guarda el resultado sin subirlo.
 */
export async function applyWatermarkToFile(
  filePath: string,
  outputPath?: string,
  options?: WatermarkOptions
): Promise<WatermarkFileResult> {
  const absoluteInput = path.resolve(filePath);
  if (!fs.existsSync(absoluteInput)) {
    throw new Error(`El fichero de imagen no existe: ${filePath}`);
  }

  const stat = fs.statSync(absoluteInput);
  if (!stat.isFile()) {
    throw new Error(`La ruta no es un fichero: ${filePath}`);
  }

  const buffer = fs.readFileSync(absoluteInput);
  const watermarkedBuffer = await applyWatermark(buffer, options ?? true);

  let targetPath = outputPath;
  if (!targetPath) {
    const dir = path.dirname(absoluteInput);
    const ext = path.extname(absoluteInput);
    const baseName = path.basename(absoluteInput, ext);
    targetPath = path.join(dir, `${baseName}-watermark${ext}`);
  } else {
    targetPath = path.resolve(targetPath);
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, watermarkedBuffer);

  const meta = await sharp(watermarkedBuffer).metadata();
  return {
    originalPath: absoluteInput,
    outputPath: targetPath,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    sizeBytes: watermarkedBuffer.length,
  };
}

