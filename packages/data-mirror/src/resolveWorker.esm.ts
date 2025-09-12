export async function resolveWorkerEntry(): Promise<URL> {
  const spec = await import.meta.resolve("@moto125/data-mirror-worker/worker");
  return new URL(spec, import.meta.url);
}