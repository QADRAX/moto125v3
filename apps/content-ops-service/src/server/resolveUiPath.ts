import path from "node:path";
import fs from "node:fs";

/**
 * Resolve absolute path to @moto125/content-ops-ui/dist
 * Fails loudly if not built.
 */
export function resolveUiDistPath(): string {
  const pkgJsonPath = require.resolve("@moto125/content-ops-ui/package.json");
  const pkgDir = path.dirname(pkgJsonPath);
  const dist = path.join(pkgDir, "dist");

  if (!fs.existsSync(dist)) {
    throw new Error(
      `UI dist not found at ${dist}. Ensure the UI package is built (e.g., "lerna run build").`
    );
  }
  const indexHtml = path.join(dist, "index.html");
  if (!fs.existsSync(indexHtml)) {
    throw new Error(`UI dist invalid: missing index.html at ${indexHtml}`);
  }
  return dist;
}
