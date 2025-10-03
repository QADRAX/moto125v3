import type { ErrorListener, ContentCacheError } from "@moto125/content-cache-core";

export class ErrorBus {
  private readonly listeners = new Set<ErrorListener>();
  private readonly lastErrors: ContentCacheError[] = [];

  onError(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(err: ContentCacheError): void {
    this.lastErrors.push(err);
    for (const l of this.listeners) l(err);
  }

  getErrors(): ReadonlyArray<ContentCacheError> {
    return this.lastErrors;
  }

  clear(): void {
    this.lastErrors.length = 0;
  }

  fromUnknown(e: any, source: ContentCacheError["source"]): void {
    const apiErrors: ContentCacheError[] | undefined = e?.__mirrorErrors;
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
