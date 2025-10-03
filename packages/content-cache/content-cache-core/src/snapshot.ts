import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { MirrorState } from "./types";

export async function saveSnapshot(filePath: string, mirrorState?: MirrorState | null): Promise<void> {
  if (!mirrorState) return;
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(mirrorState, null, 2), "utf8");
}

export async function loadSnapshot(filePath: string): Promise<MirrorState> {
  const raw = await readFile(filePath, "utf8");
  const json = JSON.parse(raw) as MirrorState;
  return json
}
