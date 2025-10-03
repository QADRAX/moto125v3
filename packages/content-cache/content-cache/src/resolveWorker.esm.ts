import { createRequire } from "node:module";

export async function resolveWorkerEntry(): Promise<string> {
  const require = createRequire(import.meta.url);
  return require.resolve("@moto125/content-cache-worker/worker");
}