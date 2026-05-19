import { createRequire } from "node:module";
import { resolveWorkerFilesystemPath } from "./resolveWorkerPath.js";

export async function resolveWorkerEntry(): Promise<string> {
  const require = createRequire(import.meta.url);
  return resolveWorkerFilesystemPath(require, import.meta.url);
}
