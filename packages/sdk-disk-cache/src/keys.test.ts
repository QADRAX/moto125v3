import { describe, expect, it } from "vitest";
import { cacheKey, stableStringify } from "./keys.js";

describe("stableStringify", () => {
  it("normaliza el orden de claves en objetos", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });

  it("distingue valores distintos", () => {
    expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 2 }));
  });

  it("maneja arrays sin reordenar", () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });
});

describe("cacheKey", () => {
  it("misma namespace + método + args → misma clave", () => {
    const a = cacheKey("articles", "list", [{ page: 1 }]);
    const b = cacheKey("articles", "list", [{ page: 1 }]);
    expect(a).toBe(b);
  });

  it("args distintos → clave distinta", () => {
    const a = cacheKey("articles", "list", [{ page: 1 }]);
    const b = cacheKey("articles", "list", [{ page: 2 }]);
    expect(a).not.toBe(b);
  });

  it("mismo contenido de objeto con distinto orden de keys → misma clave", () => {
    const a = cacheKey("articles", "list", [{ b: 1, a: 2 }]);
    const b = cacheKey("articles", "list", [{ a: 2, b: 1 }]);
    expect(a).toBe(b);
  });

  it("usa prefijo namespace.method", () => {
    const key = cacheKey("articles", "list", []);
    expect(key.startsWith("articles.list:")).toBe(true);
  });
});
