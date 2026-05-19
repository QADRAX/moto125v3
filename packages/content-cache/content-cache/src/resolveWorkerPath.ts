import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function isBundledVirtualPath(spec: string): boolean {
  return (
    spec.startsWith("[project]") ||
    spec.includes("[app-rsc]") ||
    spec.includes("[turbopack]")
  );
}

function resolveFromPackageRoot(requireFn: NodeRequire): string {
  try {
    const workerExport = requireFn.resolve(
      "@moto125/content-cache-worker/worker"
    );
    if (!isBundledVirtualPath(workerExport) && fs.existsSync(workerExport)) {
      return path.isAbsolute(workerExport)
        ? workerExport
        : path.resolve(workerExport);
    }
  } catch {
    // fall through to monorepo / node_modules candidates
  }

  const cwd = process.cwd();
  const candidates = [
    path.join(
      cwd,
      "node_modules",
      "@moto125",
      "content-cache-worker",
      "dist",
      "cache.worker.js"
    ),
    path.join(
      cwd,
      "packages",
      "content-cache",
      "content-cache-worker",
      "dist",
      "cache.worker.js"
    ),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return path.resolve(candidate);
    }
  }

  throw new Error(
    "Could not locate @moto125/content-cache-worker dist/cache.worker.js"
  );
}

/**
 * Resolves the worker entry to a real filesystem path for node:worker_threads.
 */
export function resolveWorkerFilesystemPath(
  requireFn: NodeRequire,
  moduleUrl?: string
): string {
  const fromEnv = process.env.CONTENT_CACHE_WORKER_PATH?.trim();
  if (fromEnv) {
    const abs = path.isAbsolute(fromEnv)
      ? fromEnv
      : path.resolve(fromEnv);
    if (!fs.existsSync(abs)) {
      throw new Error(
        `CONTENT_CACHE_WORKER_PATH does not exist: ${abs}`
      );
    }
    return abs;
  }

  let spec: string;
  try {
    spec = requireFn.resolve("@moto125/content-cache-worker/worker");
  } catch {
    spec = "";
  }

  let fsPath: string;
  if (spec && !isBundledVirtualPath(spec)) {
    if (spec.startsWith("file:")) {
      fsPath = fileURLToPath(spec);
    } else if (path.isAbsolute(spec)) {
      fsPath = spec;
    } else if (moduleUrl) {
      fsPath = path.resolve(path.dirname(fileURLToPath(moduleUrl)), spec);
    } else {
      fsPath = path.resolve(spec);
    }
  } else {
    fsPath = resolveFromPackageRoot(requireFn);
  }

  if (!fs.existsSync(fsPath)) {
    throw new Error(
      `Content cache worker not found at ${fsPath}. ` +
        `Run: npx lerna run build --scope @moto125/content-cache-worker`
    );
  }

  return fsPath;
}
