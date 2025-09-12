import type { MirrorState, MirrorRootState } from "./types";

let state: MirrorRootState = null;

type Listener = (next: Readonly<MirrorRootState>) => void;
const listeners = new Set<Listener>();

/** Get current mirror root state (null if not loaded). */
export function getMirrorState(): Readonly<MirrorRootState> {
  return state;
}

/** Subscribe to state changes; returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const l of listeners) l(state);
}

/** Replace the entire state (non-partial). */
export function setState(next: MirrorState): void {
  state = next;
  notify();
}

/** Reset to null (useful in tests or hot reload). */
export function resetMirror(): void {
  state = null;
  notify();
}
