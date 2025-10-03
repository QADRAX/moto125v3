import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const repoRoot      = path.resolve(__dirname, "../../..");                // monorepo root
const appRoot       = path.resolve(__dirname, "..");                      // apps/moto125-ui
const standalone    = path.join(appRoot, ".next", "standalone");          // output
const pkgsScopeDir  = path.join(standalone, "node_modules", "@moto125");  // <-- destino clave

const sources = [
  { name: "content-cache",        src: path.join(repoRoot, "packages", "content-cache") },
  { name: "content-cache-core",   src: path.join(repoRoot, "packages", "content-cache-core") },
  { name: "content-cache-worker", src: path.join(repoRoot, "packages", "content-cache-worker") },
];

async function exists(p){ try{ await fs.access(p); return true; } catch{ return false; } }
async function ensureDir(p){ await fs.mkdir(p, { recursive: true }); }

async function copyDir(src, dst, { filter } = {}) {
  await ensureDir(dst);
  const entries = await fs.readdir(src, { withFileTypes: true });
  await Promise.all(entries.map(async (e) => {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (filter && !(await filter(s, e))) return;
    if (e.isDirectory()) return copyDir(s, d, { filter });
    const data = await fs.readFile(s);
    await ensureDir(path.dirname(d));
    await fs.writeFile(d, data);
  }));
}

(async () => {
  // crea scope @moto125 en node_modules del standalone
  await ensureDir(pkgsScopeDir);

  for (const { name, src } of sources) {
    if (!(await exists(src))) {
      console.warn(`[copy-standalone] SKIP ${name}: no folder at ${src}`);
      continue;
    }

    // 1) Copia paquete completo a standalone/packages/<name> (como referencia)
    const dstPackages = path.join(standalone, "packages", name);
    await copyDir(src, dstPackages, {
      // evita arrastrar node_modules locales del workspace
      filter: async (fullPath, dirent) => !fullPath.includes(`${path.sep}node_modules${path.sep}`)
    });
    console.log(`[copy-standalone] Copied ${name} -> ${dstPackages}`);

    // 2) Copia a node_modules/@moto125/<name> (para require("@moto125/..."))
    const dstNodeModules = path.join(pkgsScopeDir, name);
    await copyDir(src, dstNodeModules, {
      filter: async (fullPath, dirent) => !fullPath.includes(`${path.sep}node_modules${path.sep}`)
    });
    console.log(`[copy-standalone] Copied ${name} -> ${dstNodeModules}`);
  }
})().catch((e) => {
  console.error("[copy-standalone] FAILED", e);
  process.exit(1);
});
