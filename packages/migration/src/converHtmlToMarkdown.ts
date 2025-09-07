import { JSDOM } from "jsdom";

/**
 * Convierte contenido HTML a Markdown para Moto125.
 *  - Tablas de ranking dentro de <p> se formatean correctamente.
 *  - Tarjetas de provincia con sub-tablas.
 *  - Tablas estándar con cabecera.
 */
export function convertHtmlToMarkdown(html: string): string {
  const dom = new JSDOM(html);
  return toMarkdown(dom.window.document.body)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** --------------------------------------------------
 * Conversión genérica nodo → Markdown
 * --------------------------------------------------*/
function toMarkdown(node: Node, level = 0): string {
  if (node.nodeType === node.TEXT_NODE) {
    return (node.textContent || "").replace(/\s+/g, " ");
  }
  if (node.nodeType !== node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    /* ---------------- texto inline ---------------- */
    case "strong":
      return `**${normalize(childMarkdown(el, level))}**`;
    case "em":
      return `*${normalize(childMarkdown(el, level))}*`;

    /* ---------------- cabeceras ---------------- */
    case "h1":
      return `# ${normalize(childMarkdown(el, level))}\n\n`;
    case "h2":
      return `## ${normalize(childMarkdown(el, level))}\n\n`;
    case "h3":
      return `### ${normalize(childMarkdown(el, level))}\n\n`;

    /* ---------------- párrafos ---------------- */
    case "p":
      return paragraphToMarkdown(el, level);

    /* ---------------- saltos ---------------- */
    case "br":
      return "  \n";

    /* ---------------- enlaces e imágenes ---------------- */
    case "a": {
      const href = el.getAttribute("href") || "";
      return `[${childMarkdown(el, level).trim()}](${href})`;
    }
    case "img": {
      const alt = el.getAttribute("alt") || "";
      const src = el.getAttribute("src") || "";
      return `![${alt}](${src})`;
    }

    /* ---------------- listas ---------------- */
    case "ul":
    case "ol":
      return listToMarkdown(el, level);
    case "li":
      return childMarkdown(el, level).trim();

    /* ---------------- tablas ---------------- */
    case "table":
      return tableToMarkdown(el, level);

    /* ---------------- default ---------------- */
    default:
      return childMarkdown(el, level);
  }
}

/** --------------------------------------------------
 * Devuelve markdown de los hijos de un elemento
 * --------------------------------------------------*/
function childMarkdown(el: HTMLElement, level = 0): string {
  return Array.from(el.childNodes).map((n) => toMarkdown(n, level)).join("");
}

/** --------------------------------------------------
 * Párrafo que puede contener tablas
 * --------------------------------------------------*/
function paragraphToMarkdown(p: HTMLElement, level: number): string {
  const mdParts: string[] = [];
  p.childNodes.forEach((child) => {
    if ((child as HTMLElement).tagName?.toLowerCase() === "table") {
      // Bloque tabla: separarlo con nuevas líneas
      mdParts.push("\n" + tableToMarkdown(child as HTMLElement, level) + "\n");
    } else {
      mdParts.push(toMarkdown(child, level));
    }
  });
  return mdParts.join("").replace(/\n{3,}/g, "\n\n").trim() + "\n\n";
}

/** --------------------------------------------------
 * Listas
 * --------------------------------------------------*/
function listToMarkdown(list: HTMLElement, level: number): string {
  const ordered = list.tagName.toLowerCase() === "ol";
  return (
    Array.from(list.children)
      .map((li, i) => {
        const prefix = ordered ? `${i + 1}.` : "-";
        return `${prefix} ${toMarkdown(li, level)}\n`;
      })
      .join("") + "\n"
  );
}

/** --------------------------------------------------
 * Tablas
 * --------------------------------------------------*/
function tableToMarkdown(table: HTMLElement, level: number): string {
  const rows = Array.from(table.querySelectorAll(":scope > tbody > tr, :scope > tr"));
  if (!rows.length) return "";

  // Si existe sub‑tabla en alguna celda → tarjeta provincia
  const hasNested = rows.some((r) => r.querySelector("table"));
  if (hasNested) return buildProvinceCards(rows, level);

  return buildStandardTable(rows);
}

/* ---------- tarjetas de provincia ---------- */
function buildProvinceCards(rows: Element[], level: number): string {
  const md: string[] = [];
  rows.forEach((row) => {
    const nested = row.querySelector<HTMLElement>("table");
    if (!nested) return;
    const cells = Array.from(row.children) as HTMLElement[];
    if (cells.length < 3) return;

    const title = normalize(childMarkdown(cells[0], level));
    if (title) md.push(`${"#".repeat(Math.min(level + 3, 6))} ${title}`);

    const img = cells[1].querySelector<HTMLImageElement>("img");
    if (img) md.push(`![${img.alt || title}](${img.src})`);

    md.push(tableToMarkdown(nested, level + 1).trim());
    md.push("");
  });
  return md.join("\n");
}

/* ---------- tabla estándar ---------- */
function buildStandardTable(rows: Element[]): string {
  const headerCells = Array.from(rows[0].children).map((c) => sanitize(toMarkdown(c)));
  const md: string[] = [];
  md.push(`| ${headerCells.join(" | ")} |`);
  md.push(`| ${headerCells.map(() => "---").join(" | ")} |`);
  rows.slice(1).forEach((r) => {
    const cells = Array.from(r.children).map((c) => sanitize(toMarkdown(c)));
    md.push(`| ${cells.join(" | ")} |`);
  });
  return md.join("\n") + "\n";
}

/** --------------------------------------------------
 * Utilidades
 * --------------------------------------------------*/
function sanitize(text: string): string {
  return text.replace(/\n/g, " ").replace(/\|/g, "\\|").trim();
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
