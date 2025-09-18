import type { ErrorListener, MirrorError } from "@moto125/data-mirror-core";

export class MirrorErrorBus {
  private readonly listeners = new Set<ErrorListener>();
  private readonly lastErrors: MirrorError[] = [];

  onError(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(err: MirrorError): void {
    this.lastErrors.push(err);
    for (const l of this.listeners) l(err);
  }

  getErrors(): ReadonlyArray<MirrorError> {
    return this.lastErrors;
  }

  clear(): void {
    this.lastErrors.length = 0;
  }

  fromUnknown(e: any, source: MirrorError["source"]): void {
    const apiErrors: MirrorError[] | undefined = e?.__mirrorErrors;
    if (Array.isArray(apiErrors) && apiErrors.length > 0) {
      for (const err of apiErrors) this.emit(err);
      return;
    }
    this.emit({
      time: new Date().toISOString(),
      source,
      code: "UNKNOWN",
      status: undefined,
      message: e?.message ?? String(e),
      detail: e?.stack ?? undefined,
    });
  }

  dispose(): void {
    this.listeners.clear();
    this.lastErrors.length = 0;
  }
}
