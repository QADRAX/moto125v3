import { ArticlePrestaciones } from '../types/entities';

/**
 * Parse strings like "4,84 s (52,9 km/h)" into numeric value + unit.
 */
export function parseAccMetric(input?: string) {
  if (!input) return null;
  const normalized = input.replace(/\./g, '').replace(',', '.');
  const main = normalized.match(/([\d.]+)\s*([a-zA-Z/%°]+)?/);
  const extra = normalized.match(/\(([\d.]+)\s*([^)]+)\)/);
  return {
    value: main ? Number(main[1]) : null,
    unit: main?.[2] ?? null,
    extra: extra ? { value: Number(extra[1]), unit: extra[2].trim() } : null,
    raw: input,
  };
}

/** Example: transform ArticlePrestaciones into a render-friendly DTO */
export function normalizePrestaciones(p?: ArticlePrestaciones) {
  if (!p) return null;
  return {
    acc50m: parseAccMetric(p.acc50m),
    acc100m: parseAccMetric(p.acc100m),
    acc400m: parseAccMetric(p.acc400m),
    acc1000m: parseAccMetric(p.acc1000m),
    acc100kmh: parseAccMetric(p.acc100kmh),
    maxSpeed: parseAccMetric(p.maxSpeed),
    consumo: p.consumo ?? null,
    autonomia: p.autonomia ?? null,
    pesoTotal: p.pesoTotal ?? null,
    repartoTrasero: p.repartoTrasero ?? null,
    repartoFrontral: p.repartoFrontral ?? null
  };
}
