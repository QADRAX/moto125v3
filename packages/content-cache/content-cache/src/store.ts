import { ContentCacheRootState, ContentCacheState } from "@moto125/content-cache-core";

let state: ContentCacheRootState = null;

type Listener = (next: Readonly<ContentCacheRootState>) => void;
const listeners = new Set<Listener>();

export function getMirrorState(): Readonly<ContentCacheRootState> {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const l of listeners) l(state);
}

export function setState(next: ContentCacheState): void {
  state = next;
  notify();
}

export function resetMirror(): void {
  state = null;
  notify();
}
