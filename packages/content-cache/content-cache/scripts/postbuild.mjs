import { promises as fs } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyIfExists(src, dst) {
  try {
    await ensureDir(dirname(dst));
    await fs.copyFile(src, dst);
    return true;
  } catch (e) {
    if (e && e.code === "ENOENT") return false;
    throw e;
  }
}

async function writeJSON(file, obj) {
  await ensureDir(dirname(file));
  await fs.writeFile(file, JSON.stringify(obj, null, 2), "utf8");
}

async function main() {
  const root = resolve(__dirname, "..");
  const esmDir = join(root, "dist", "esm");
  const cjsDir = join(root, "dist", "cjs");

  await writeJSON(join(cjsDir, "package.json"), { type: "commonjs" });
  console.log('Wrote dist/cjs/package.json { "type": "commonjs" }');

  // ESM: resolveWorker.esm.js -> resolveWorker.js (+map +d.ts)
  const esmOk = await copyIfExists(
    join(esmDir, "resolveWorker.esm.js"),
    join(esmDir, "resolveWorker.js")
  );
  if (esmOk) console.log("[postbuild] ESM facade resolveWorker.js created");

  await copyIfExists(
    join(esmDir, "resolveWorker.esm.js.map"),
    join(esmDir, "resolveWorker.js.map")
  );
  await copyIfExists(
    join(esmDir, "resolveWorker.esm.d.ts"),
    join(esmDir, "resolveWorker.d.ts")
  );

  // CJS: resolveWorker.cjs.js -> resolveWorker.js (+map +d.ts)
  const cjsOk = await copyIfExists(
    join(cjsDir, "resolveWorker.cjs.js"),
    join(cjsDir, "resolveWorker.js")
  );
  if (cjsOk) console.log("[postbuild] CJS facade resolveWorker.js created");

  await copyIfExists(
    join(cjsDir, "resolveWorker.cjs.js.map"),
    join(cjsDir, "resolveWorker.js.map")
  );
  await copyIfExists(
    join(cjsDir, "resolveWorker.cjs.d.ts"),
    join(cjsDir, "resolveWorker.d.ts")
  );

  if (!esmOk && !cjsOk) {
    console.warn(
      "[postbuild] WARNING: no se encontraron los builds de resolveWorker.*. " +
      "¿Se compilaron tsconfig.json y tsconfig.cjs.json?"
    );
  }
}

main().catch((e) => {
  console.error("[postbuild] failed:", e);
  process.exit(1);
});
