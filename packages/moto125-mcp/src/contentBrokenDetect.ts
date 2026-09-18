/**
 * Detección de content markdown oficialmente roto en bloques text-content.
 * Solo fallos que rompen el render (GFM / HTML residual). Sin estilo editorial.
 */

export type BrokenContentReason =
  | "html_residual"
  | "tabla_sin_separador"
  | "tabla_celdas_desiguales"
  | "tabla_malformada";

export type BrokenContentFinding = {
  reason: BrokenContentReason;
  detail: string;
  blockIndex: number;
};

const HTML_RESIDUAL_RE =
  /<\/?(?:table|thead|tbody|tr|td|th|div|span|p|br|ul|ol|li|h[1-6]|iframe|font|center)\b/i;

/** Cuenta celdas de una fila GFM `| a | b |` → 2. */
function tableCellCount(line: string): number {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return 0;
  const inner = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  if (!inner.trim()) return 0;
  return inner.split("|").length;
}

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return false;
  // | --- | :---: | ---: |
  const inner = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  const cells = inner.split("|").map((c) => c.trim());
  if (!cells.length) return false;
  return cells.every((c) => /^:?-{3,}:?$/.test(c));
}

function isPipeRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.includes("|", 1);
}

/**
 * Analiza grupos consecutivos de filas con `|`.
 */
function findBrokenTables(
  text: string,
  blockIndex: number
): BrokenContentFinding[] {
  const findings: BrokenContentFinding[] = [];
  const lines = text.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    if (!isPipeRow(lines[i]!)) {
      i += 1;
      continue;
    }

    const start = i;
    const group: string[] = [];
    while (i < lines.length && isPipeRow(lines[i]!)) {
      group.push(lines[i]!);
      i += 1;
    }

    // Una sola fila con pipes no es tabla GFM válida (salvo rarezas); marcar
    if (group.length === 1) {
      findings.push({
        reason: "tabla_malformada",
        detail: `Bloque ${blockIndex}: fila única con | (línea ~${start + 1})`,
        blockIndex,
      });
      continue;
    }

    const sepIndex = group.findIndex(isSeparatorRow);
    if (sepIndex < 0) {
      findings.push({
        reason: "tabla_sin_separador",
        detail: `Bloque ${blockIndex}: ${group.length} filas | sin fila separadora --- (línea ~${start + 1})`,
        blockIndex,
      });
      continue;
    }

    // Header = filas antes del separador; body = después
    const dataRows = group.filter((_, idx) => idx !== sepIndex);
    const counts = dataRows.map(tableCellCount).filter((n) => n > 0);
    if (counts.length >= 2) {
      const first = counts[0]!;
      const unequal = counts.some((n) => n !== first);
      if (unequal) {
        findings.push({
          reason: "tabla_celdas_desiguales",
          detail: `Bloque ${blockIndex}: filas con ${counts.join(",")} celdas (línea ~${start + 1})`,
          blockIndex,
        });
      }
    }
  }

  return findings;
}

export function detectBrokenText(
  text: string | null | undefined,
  blockIndex: number
): BrokenContentFinding[] {
  if (!text || !text.trim()) return [];

  const findings: BrokenContentFinding[] = [];

  if (HTML_RESIDUAL_RE.test(text)) {
    const m = text.match(HTML_RESIDUAL_RE);
    findings.push({
      reason: "html_residual",
      detail: `Bloque ${blockIndex}: HTML residual (${m?.[0] ?? "tag"})`,
      blockIndex,
    });
  }

  findings.push(...findBrokenTables(text, blockIndex));
  return findings;
}

export function detectBrokenArticleContent(
  content:
    | Array<{ __component?: string; Text?: string | null }>
    | null
    | undefined
): BrokenContentFinding[] {
  if (!Array.isArray(content)) return [];
  const out: BrokenContentFinding[] = [];
  content.forEach((block, index) => {
    if (block.__component !== "article-content.text-content") return;
    out.push(...detectBrokenText(block.Text, index));
  });
  return out;
}
