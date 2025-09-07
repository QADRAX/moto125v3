import { callGemini } from "./callGemini";
import { GeminiModel } from "./types/Gemini";

export interface BrandModels {
  /** Nombre de la marca, p. ej. "Honda"  */
  marca: string;
  /** Modelos citados (sin repetir). Vacío si solo se menciona la marca. */
  modelos: string[];
}

/**
 * Extrae del texto de un artículo todas las marcas y modelos mencionados.
 *
 * @param articleText Texto íntegro del artículo.
 * @param apiKey      Clave de la API de Gemini.
 * @param model       Modelo de Gemini (por defecto “gemini-2.0-flash”).
 * @returns           Array de objetos { marca, modelos } ordenado por marca.
 */
export async function extractMarcasModelos(
  articleText: string,
  apiKey: string,
  model: GeminiModel = "gemini-2.0-flash"
): Promise<BrandModels[]> {
  /* 1. Prompt “cerrado” en el que exigimos JSON puro
        - agrupado por marca;
        - modelos únicos y ordenados alfabéticamente;
        - array vacío si no hay modelos;
        - [] si no hay ninguna marca. */
  const prompt = `
Eres un extractor de datos para un portal de motociclismo.  
Devuelve **EXCLUSIVAMENTE** un JSON VÁLIDO (sin texto antes ni después) con este formato exacto:

[
  {
    "marca": "<Nombre de la marca>",
    "modelos": ["<Modelo 1>", "<Modelo 2>", ...] // Si no hay modelos, un array vacío []
  },
  ...
]

Reglas:
- Agrupa todos los modelos bajo su marca correspondiente.
- No dupliques modelos. Ordena las listas alfabéticamente.
- Si el artículo no menciona ninguna marca, devuelve [].
- No incluyas comentarios ni claves extra.

Artículo:
"""${articleText}"""
`;

  /* 2. Llamamos a Gemini */
  const raw = await callGemini(prompt, apiKey, model);

  /* 3. Eliminamos fences ```json ... ``` si los hubiera */
  const clean = raw.replace(/```json|```/g, "").trim();

  /* 4. Parseo y validación básica */
  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error(`La respuesta de Gemini no es JSON válido:\n${raw}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("La respuesta JSON no es un array.");
  }

  /* 5. Deduplicación defensiva por si Gemini se repite */
  const mapa = new Map<string, Set<string>>();
  for (const item of parsed as any[]) {
    if (typeof item?.marca !== "string" || !Array.isArray(item?.modelos)) continue;

    const marca = item.marca.trim();
    const modelos = item.modelos
      .filter((m: any) => typeof m === "string")
      .map((m: string) => m.trim());

    if (!mapa.has(marca)) mapa.set(marca, new Set<string>());
    const set = mapa.get(marca)!;
    for (const modelo of modelos) set.add(modelo);
  }

  /* 6. Normalizamos a BrandModels[] */
  const result: BrandModels[] = [...mapa.entries()]
    .map(([marca, set]) => ({
      marca,
      modelos: [...set].sort((a, b) => a.localeCompare(b, "es")),
    }))
    .sort((a, b) => a.marca.localeCompare(b.marca, "es"));

  return result;
}
