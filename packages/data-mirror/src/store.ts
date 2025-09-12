import { MirrorRootState, MirrorState } from "@moto125/data-mirror-core";

let state: MirrorRootState = null;

type Listener = (next: Readonly<MirrorRootState>) => void;
const listeners = new Set<Listener>();

export function getMirrorState(): Readonly<MirrorRootState> {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const l of listeners) l(state);
}

export function setState(next: MirrorState): void {
  state = next;
  notify();
}

export function resetMirror(): void {
  state = null;
  notify();
}
