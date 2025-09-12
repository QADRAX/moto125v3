export async function resolveWorkerEntry(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const spec = require.resolve("@moto125/data-mirror-worker/worker");
  return spec;
}
