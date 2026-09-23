/**
 * Detección de problemas de imágenes en markdown de article-content.text-content.
 * Solo lectura: saltos de línea faltantes y chrome/assets de moto125 v1.
 */

export type ImageIssueReason = "imagen_sin_salto" | "imagen_chrome_v1";

export type ImageIssueFinding = {
  reason: ImageIssueReason;
  detail: string;
  blockIndex: number;
};

/** `![alt](url)` — alt sin `]`; url sin `)`. */
const MD_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/**
 * Paths / nombres típicos de chrome, banners y UI del sitio/CMS v1.
 * No incluye fotos de pruebas bajo images/stories/motos|pruebas|…
 */
const CHROME_URL_RE =
  /(?:\/images\/Ban\/|\/images\/banners\/|\/images\/M_images\/|\/images\/stories\/modulos\/|diseologitoparaweb|burbuverde\.gif|(?:^|[\\/])(?:Ban[A-Za-z0-9._-]*|Adonis\.gif|ban-[a-z0-9._-]+|728x90|468x60|300x250_emociones))/i;

function isPipeTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.includes("|", 1);
}

function lineMeta(
  text: string,
  index: number
): { line: string; lineNo: number } {
  let lineNo = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) lineNo += 1;
  }
  const lineStart = text.lastIndexOf("\n", index - 1) + 1;
  const lineEnd = text.indexOf("\n", index);
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
  return { line, lineNo };
}

/** ¿Hay `\n\n` (ignorando espacios/tabs en las líneas en blanco) justo antes de `index`? */
function hasBlankLineBefore(text: string, index: number): boolean {
  if (index <= 0) return true;
  let i = index - 1;
  // espacios en la misma línea antes de la imagen
  while (i >= 0 && (text[i] === " " || text[i] === "\t")) i -= 1;
  if (i < 0) return true;
  if (text[i] !== "\n") return false;
  i -= 1;
  while (i >= 0 && (text[i] === " " || text[i] === "\t")) i -= 1;
  if (i < 0) return true;
  return text[i] === "\n";
}

/** ¿Hay `\n\n` (ignorando espacios/tabs) justo después de `index` (exclusive end)? */
function hasBlankLineAfter(text: string, end: number): boolean {
  if (end >= text.length) return true;
  let i = end;
  while (i < text.length && (text[i] === " " || text[i] === "\t")) i += 1;
  if (i >= text.length) return true;
  if (text[i] !== "\n") return false;
  i += 1;
  while (i < text.length && (text[i] === " " || text[i] === "\t")) i += 1;
  if (i >= text.length) return true;
  return text[i] === "\n";
}

function shortUrl(url: string): string {
  if (url.length <= 72) return url;
  return `${url.slice(0, 40)}…${url.slice(-20)}`;
}

export function detectImageIssuesInText(
  text: string | null | undefined,
  blockIndex: number
): ImageIssueFinding[] {
  if (!text || !text.trim()) return [];

  const findings: ImageIssueFinding[] = [];
  MD_IMAGE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = MD_IMAGE_RE.exec(text)) !== null) {
    const full = m[0]!;
    const url = m[2]!;
    const start = m.index;
    const end = start + full.length;
    const { line, lineNo } = lineMeta(text, start);

    if (isPipeTableRow(line)) {
      // Galerías "Con lupa" / celdas: no exigir salto de bloque
      if (CHROME_URL_RE.test(url)) {
        findings.push({
          reason: "imagen_chrome_v1",
          detail: `Bloque ${blockIndex} L${lineNo}: chrome/v1 en tabla (${shortUrl(url)})`,
          blockIndex,
        });
      }
      continue;
    }

    if (CHROME_URL_RE.test(url)) {
      findings.push({
        reason: "imagen_chrome_v1",
        detail: `Bloque ${blockIndex} L${lineNo}: chrome/v1 (${shortUrl(url)})`,
        blockIndex,
      });
    }

    const okBefore = hasBlankLineBefore(text, start);
    const okAfter = hasBlankLineAfter(text, end);
    if (!okBefore || !okAfter) {
      const parts: string[] = [];
      if (!okBefore) parts.push("antes");
      if (!okAfter) parts.push("después");
      findings.push({
        reason: "imagen_sin_salto",
        detail: `Bloque ${blockIndex} L${lineNo}: falta salto ${parts.join("+")} (${shortUrl(url)})`,
        blockIndex,
      });
    }
  }

  return findings;
}

export function detectImageIssuesInArticleContent(
  content:
    | Array<{ __component?: string; Text?: string | null }>
    | null
    | undefined
): ImageIssueFinding[] {
  if (!Array.isArray(content)) return [];
  const out: ImageIssueFinding[] = [];
  content.forEach((block, index) => {
    if (block.__component !== "article-content.text-content") return;
    out.push(...detectImageIssuesInText(block.Text, index));
  });
  return out;
}
