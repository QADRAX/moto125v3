import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { MirrorState } from "./types";
import { setState, getMirrorState } from "./store";

/** Save current mirror state to a JSON file (pretty-printed). */
export async function saveSnapshot(filePath: string): Promise<void> {
  const current = getMirrorState();
  if (!current) return; // nothing to persist
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(current, null, 2), "utf8");
}

/** Load mirror state from a JSON file; minimal guards. */
export async function loadSnapshot(filePath: string): Promise<void> {
  const raw = await readFile(filePath, "utf8");
  const json = JSON.parse(raw) as MirrorState;
  setState({
    ...json,
    generatedAt: json?.generatedAt ?? new Date().toISOString(),
  });
}
