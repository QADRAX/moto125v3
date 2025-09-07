import * as cheerio from "cheerio";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { BASE_URL } from "./constants";
import { Creditos, DebilidadesFortalezas, Prestaciones } from "./types";

// Configurar DOMPurify para usar JSDOM
const window = new JSDOM("").window;
const DOMPurifyInstance = DOMPurify(window);

function removeNewLinesAndTabs(input: string): string {
  return input.replace(/[\n\t]/g, "");
}

export function extractPrestacionesFromHtml(
  html: string
): Prestaciones | undefined {
  const $ = cheerio.load(html);

  let prestaciones: Partial<Prestaciones> = {};

  $("table tbody tr").each((_, row) => {
    const label = $(row).find("td").first().text().trim().toLowerCase();
    const value = $(row).find("td").last().text().trim();

    if (label.includes("0-50 m")) {
      prestaciones.acc50m = value;
    } else if (label.includes("0-100 m")) {
      prestaciones.acc100m = value;
    } else if (label.includes("0-400 m")) {
      prestaciones.acc400m = value;
    } else if (label.includes("0-1.000 m")) {
      prestaciones.acc1000m = value;
    } else if (label.includes("0-100 km/h")) {
      prestaciones.acc100kmh = value;
    } else if (label.includes("velocidad máxima")) {
      prestaciones.maxSpeed = value;
    } else if (label.includes("consumo")) {
      prestaciones.consumo = value;
    } else if (label.includes("autonomía")) {
      prestaciones.autonomia = value;
    } else if (label.includes("peso total lleno")) {
      prestaciones.pesoTotal = value;
    } else if (label.includes("reparto tren delantero")) {
      prestaciones.repartoFrontral = value;
    } else if (label.includes("reparto tren trasero")) {
      prestaciones.repartoTrasero = value;
    }
  });

  // Verificar si al menos una propiedad ha sido asignada
  if (Object.keys(prestaciones).length > 0) {
    return prestaciones as Prestaciones;
  }

  return undefined;
}

export function extractFichaTecnicaIdFromHtml(
  html: string
): string | undefined {
  const $ = cheerio.load(html);

  const table = $("table").filter((_, el) =>
    $(el).text().toLowerCase().includes("ficha técnica")
  );

  const link = table.find('a[href*="id_a_moto="]').attr("href");
  if (!link) return undefined;

  const match = link.match(/id_a_moto=(\d+)/);
  return match?.[1];
}

export function removeFichaTecnicaTableFromHtml(html: string): string {
  const $ = cheerio.load(html);

  $("table").each((_, table) => {
    const text = $(table).text().toLowerCase();
    if (text.includes("ficha técnica")) {
      $(table).remove();
    }
  });

  return $.html();
}

export function removePrestacionesTableFromHtml(html: string): string {
  const $ = cheerio.load(html);

  // 1. Eliminar <h1> que contenga "prestaciones"
  $("h1").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").toLowerCase().trim();
    if (text.includes("prestaciones")) {
      $(el).remove();
    }
  });

  // 2. Eliminar tabla de prestaciones
  $("table").each((_, table) => {
    const rows = $(table).find("tbody tr");
    let found = false;

    rows.each((_, row) => {
      const label = $(row).find("td").first().text().trim().toLowerCase();

      if (
        label.includes("0-50 m") ||
        label.includes("0-100 m") ||
        label.includes("0-400 m") ||
        label.includes("0-1.000 m") ||
        label.includes("velocidad máxima") ||
        label.includes("consumo") ||
        label.includes("autonomía") ||
        label.includes("peso total lleno") ||
        label.includes("reparto tren delantero") ||
        label.includes("reparto tren trasero")
      ) {
        found = true;
      }
    });

    if (found) {
      $(table).remove();
    }
  });

  return $.html();
}
export function extractYouTubeLinkFromHtml(html: string): string | undefined {
  const $ = cheerio.load(html);

  // Buscar todos los iframes
  const iframe = $("iframe")
    .filter((_, el) => {
      const src = $(el).attr("src");
      return src?.includes("youtube.com/embed") ?? false;
    })
    .first();

  // Extraer el enlace del primer iframe encontrado
  if (iframe.length > 0) {
    return iframe.attr("src");
  }

  return undefined;
}

export function removeYouTubeIframeFromHtml(html: string): string {
  const $ = cheerio.load(html);

  $("iframe").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    if (src.includes("youtube.com/embed")) {
      $(el).remove();
    }
  });

  return $.html();
}

export function extractFortalezasDebilidadesFromHtml(
  html: string
): DebilidadesFortalezas | undefined {
  const $ = cheerio.load(html);

  let fortalezas: string[] = [];
  let debilidades: string[] = [];

  // Buscar la tabla que contiene las fortalezas y debilidades
  const table = $("table");
  let foundTable = false;

  table.each((_, element) => {
    const rows = $(element).find("tr");

    if (rows.length >= 2) {
      const firstRow = $(rows[0]).find("img");
      const secondRow = $(rows[1]).find("td");

      // Verificar que la tabla tiene la estructura deseada
      if (firstRow.length === 2 && secondRow.length === 2) {
        foundTable = true;

        // Extraer fortalezas
        const fortalezasHtml = $(secondRow[0]).find("p");
        fortalezas = fortalezasHtml.map((_, el) => $(el).text().trim()).get();

        // Extraer debilidades
        const debilidadesHtml = $(secondRow[1]).find("p");
        debilidades = debilidadesHtml.map((_, el) => $(el).text().trim()).get();
      }
    }
  });

  if (foundTable) {
    return {
      debilidades: debilidades.filter((d) => d != ""),
      fortalezas: fortalezas.filter((f) => f != ""),
    };
  }

  return undefined;
}

function isFortalezasDebilidadesTable(table: any, $: any): boolean {
  return $(table).find('img[src*="burbuverde.gif"]').length > 0;
}

export function removeFortalezasDebilidadesFromHtml(html: string): string {
  const $ = cheerio.load(html);
  $("table").each((_, table) => {
    if (isFortalezasDebilidadesTable(table, $)) {
      $(table).remove();
    }
  });

  return $.html();
}

export function extractCreditosFromHtml(html: string): Creditos | undefined {
  const $ = cheerio.load(html);

  let authorText = "";
  let authorPhotos = "";
  let authorAccion = "";

  // Buscar los primeros <li> del documento (dentro o fuera de <ul>)
  $("li").each((_, el) => {
    const raw = $(el).text().trim();
    const normalized = raw.replace(/\s*[-–—]\s*/, " - ");

    if (normalized.toLowerCase().startsWith("autor del texto")) {
      authorText = normalized.split(" - ")[1]?.trim() || "";
    } else if (normalized.toLowerCase().startsWith("autor de fotos")) {
      authorPhotos = normalized.split(" - ")[1]?.trim() || "";
    } else if (normalized.toLowerCase().startsWith("autor acción")) {
      authorAccion = normalized.split(" - ")[1]?.trim() || "";
    }
  });

  if (!authorText) return undefined;

  return {
    authorText,
    authorPhotos,
    authorAccion,
  };
}

export function removeCreditosFromHtml(html: string): string {
  const $ = cheerio.load(html);

  // Elimina los <li> que coincidan con los créditos o la fecha
  $('li').each((_, el) => {
    const text = $(el).text().trim().toLowerCase();

    if (
      text.startsWith('autor del texto') ||
      text.startsWith('autor de fotos') ||
      text.startsWith('autor fotos de accion') ||
      text.startsWith('autor acción') ||
      text.startsWith('autor de acción') ||
      text.startsWith('autor acción fotos') ||
      text.startsWith('fecha')
    ) {
      $(el).remove();
    }
  });

  // Si hay <ul> o <ol> vacíos después de quitar los <li>, los borramos
  $('ul, ol').each((_, el) => {
    if ($(el).children('li').length === 0) {
      $(el).remove();
    }
  });

  return $.html();
}

export function cleanHtmlArticle(html: string): string {
  const $ = cheerio.load(html);

  // Remove <ul> elements with class 'moto125InfoPrueba'
  $("ul.moto125InfoPrueba").remove();

  // Remove tables containing "Ver FICHA TÉCNICA"
  $("table").each((_, element) => {
    if ($(element).text().includes("Ver FICHA TÉCNICA")) {
      $(element).remove();
    }
  });

  // Remove the table of strengths and weaknesses
  $("table").each((_, element) => {
    const firstImgAlt = $(element).find("td img").first().attr("alt");
    if (firstImgAlt === "Positivo" || firstImgAlt === "Negativo") {
      $(element).remove();
    }
  });

  // Remove <h1> elements that contain the word "Prestaciones"
  $("h1").each((_, element) => {
    if ($(element).text().includes("Prestaciones")) {
      $(element).remove();
    }
  });

  // Remove the performance table based on specific features
  $("table").each((_, element) => {
    const tableContent = $(element).text();

    const containsPerformanceMetrics = [
      "Aceleración 0-50 m",
      "Aceleración 0-100 m",
      "Aceleración 0-400 m",
      "Velocidad máxima",
      "Consumo",
      "Autonomía",
      "Peso total lleno",
      "Reparto tren delantero",
      "Reparto tren trasero",
    ].some((metric) => tableContent.includes(metric));

    if (containsPerformanceMetrics) {
      $(element).remove();
    }
  });

  return $.html();
}

export function sanitizeHtml(html: string): string {
  // Load the HTML content using Cheerio
  const $ = cheerio.load(removeNewLinesAndTabs(html));

  // Eliminar comentarios innecesarios (ejemplo: <!-- wp:html -->)
  $("*")
    .contents()
    .each(function () {
      if (this.type === "comment") {
        $(this).remove();
      }
    });

  $("hr").remove();

  // Elimina cualquier <img> con 'diseologitoparaweb.gif' en el atributo src
  $("img").each((_, element) => {
    const src = $(element).attr("src");
    if (src && src.includes("diseologitoparaweb.gif")) {
      $(element).remove();
    }
  });

  // Procesar imágenes: normalizar URLs y mantener solo los atributos relevantes
  $("img").each((_, img) => {
    const $img = $(img);
    let src = $img.attr("src");
    if (src) {
      // Verificar si la URL no tiene un esquema (http, https)
      if (!src.startsWith("http://") && !src.startsWith("https://")) {
        // Añadir la base URL al inicio de la URL de la imagen
        src = BASE_URL + src.replace(/^\.\.?\//, ""); // Remueve ../ o ./
        $img.attr("src", src);
      }
    }
    // Mantener solo los atributos src y alt
    $img.removeAttr("decoding loading border");
  });

  // Sanitizar el HTML con DOMPurify
  const cleanedHtml = $.html();
  const sanitizedHtml = DOMPurifyInstance.sanitize(cleanedHtml);

  return cleanedHtml;
}

export function getAbsoluteUrl(baseUrl: string, src: string): string {
  try {
    // If the src is already an absolute URL, return it as is
    const absoluteUrl = new URL(src, baseUrl);
    return absoluteUrl.href;
  } catch (error) {
    throw new Error(`Invalid URL`);
  }
}
