import { describe, expect, it } from "vitest";
import {
  detectImageIssuesInArticleContent,
  detectImageIssuesInText,
} from "./contentImageDetect.js";

const PHOTO =
  "https://moto125storage.blob.core.windows.net/moto125/images/stories/motos/m71/f101.jpg";
const BAN =
  "https://moto125storage.blob.core.windows.net/moto125/images/Ban/Adonis.gif";
const MIMG =
  "https://moto125storage.blob.core.windows.net/moto125/images/M_images/arrow.png";

describe("detectImageIssuesInText", () => {
  it("OK si la imagen va entre líneas en blanco", () => {
    const text = `Intro.\n\n![](${PHOTO})\n\nSigue el texto.`;
    expect(detectImageIssuesInText(text, 0)).toEqual([]);
  });

  it("OK al inicio y al final del bloque con salto al otro lado", () => {
    expect(detectImageIssuesInText(`![](${PHOTO})\n\nTexto.`, 0)).toEqual([]);
    expect(detectImageIssuesInText(`Texto.\n\n![](${PHOTO})`, 0)).toEqual([]);
  });

  it("flag imagen pegada al texto (antes y después)", () => {
    const text = `Fin.*![](${PHOTO})Pues como sospechabas…`;
    const findings = detectImageIssuesInText(text, 2);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.reason).toBe("imagen_sin_salto");
    expect(findings[0]!.detail).toContain("antes+después");
    expect(findings[0]!.blockIndex).toBe(2);
  });

  it("flag solo falta salto después", () => {
    const text = `Intro.\n\n![](${PHOTO})Aunque el MP3…`;
    const findings = detectImageIssuesInText(text, 0);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.detail).toContain("después");
    expect(findings[0]!.detail).not.toContain("antes");
  });

  it("flag solo falta salto antes", () => {
    const text = `***3ª- SEGUROS***![](${PHOTO})\n\nHace unos años…`;
    const findings = detectImageIssuesInText(text, 0);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.detail).toContain("antes");
    expect(findings[0]!.detail).not.toContain("después");
  });

  it("un solo \\n no basta (sigue siendo el mismo párrafo)", () => {
    const text = `Antes.\n![](${PHOTO})\nDespués.`;
    const findings = detectImageIssuesInText(text, 0);
    expect(findings.some((f) => f.reason === "imagen_sin_salto")).toBe(true);
  });

  it("no exige salto dentro de filas de tabla GFM", () => {
    const text = [
      "| ![](" + PHOTO + ") | ![](" + PHOTO + ") |",
      "| --- | --- |",
      "| *pie* | *pie* |",
    ].join("\n");
    expect(detectImageIssuesInText(text, 0)).toEqual([]);
  });

  it("detecta chrome v1 Ban / M_images / diseologitoparaweb", () => {
    const text = `Intro.\n\n![](${BAN})\n\n![](${MIMG})\n\n![](https://x/diseologitoparaweb.gif)\n\nOk.`;
    const findings = detectImageIssuesInText(text, 0);
    const chrome = findings.filter((f) => f.reason === "imagen_chrome_v1");
    expect(chrome).toHaveLength(3);
  });

  it("chrome en tabla también se reporta", () => {
    const text = `| ![](${BAN}) |\n| --- |\n| *x* |`;
    const findings = detectImageIssuesInText(text, 0);
    expect(findings).toEqual([
      expect.objectContaining({ reason: "imagen_chrome_v1" }),
    ]);
  });

  it("dos imágenes pegadas sin salto entre ellas", () => {
    const text = `![](${PHOTO})![](${PHOTO})\n\nTexto.`;
    const findings = detectImageIssuesInText(text, 0).filter(
      (f) => f.reason === "imagen_sin_salto"
    );
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });
});

describe("detectImageIssuesInArticleContent", () => {
  it("solo mira text-content", () => {
    const findings = detectImageIssuesInArticleContent([
      {
        __component: "article-content.prestaciones",
        Text: `pegado![](${PHOTO})pegado`,
      } as { __component?: string; Text?: string | null },
      {
        __component: "article-content.text-content",
        Text: `pegado![](${PHOTO})pegado`,
      },
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.blockIndex).toBe(1);
  });
});
