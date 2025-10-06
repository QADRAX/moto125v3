import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

await build({
    entryPoints: [join(root, "src/main.ts")],
    outfile: join(root, "dist/assets/app.js"),
    bundle: true,
    format: "esm",
    target: "es2022",
    sourcemap: true,
    minify: true
});

// copy static files to dist
await execa("node", ["-e", `
  import cpy from 'cpy';
  const { dirname, join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const root = join(__dirname, '..');
  await cpy(['index.html', 'src/style.css'], 'dist', { cwd: root, parents: false, rename: (p) => p === 'src/style.css' ? 'assets/style.css' : p });
`], { stdio: "inherit" });

console.log("UI build completed");
