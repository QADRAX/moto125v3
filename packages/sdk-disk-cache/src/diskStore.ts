import { createHash } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

export type DiskStoreOptions = {
  dir: string;
  defaultTtlMs?: number;
  enabled?: boolean;
};

export type DiskStoreStats = {
  dir: string;
  enabled: boolean;
  count: number;
};

export type DiskStore = {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<number>;
  clear(): Promise<void>;
  stats(): Promise<DiskStoreStats>;
  readonly dir: string;
  readonly enabled: boolean;
};

type DiskEntry = {
  key: string;
  savedAt: number;
  ttlMs: number;
  value: unknown;
};

function fileNameForKey(key: string): string {
  return createHash("sha256").update(key).digest("hex") + ".json";
}

export function createDiskStore(options: DiskStoreOptions): DiskStore {
  const dir = options.dir;
  const defaultTtlMs = options.defaultTtlMs ?? 300_000;
  const enabled = options.enabled !== false;
  let ready: Promise<void> | null = null;

  const ensureDir = async () => {
    if (!enabled) return;
    if (!ready) {
      ready = mkdir(dir, { recursive: true }).then(() => undefined);
    }
    await ready;
  };

  const pathFor = (key: string) => join(dir, fileNameForKey(key));

  const readEntry = async (key: string): Promise<DiskEntry | null> => {
    if (!enabled) return null;
    try {
      const raw = await readFile(pathFor(key), "utf8");
      return JSON.parse(raw) as DiskEntry;
    } catch {
      return null;
    }
  };

  return {
    dir,
    enabled,

    async get<T = unknown>(key: string): Promise<T | undefined> {
      if (!enabled) return undefined;
      await ensureDir();
      const entry = await readEntry(key);
      if (!entry || entry.key !== key) return undefined;
      const age = Date.now() - entry.savedAt;
      if (age > entry.ttlMs) {
        try {
          await unlink(pathFor(key));
        } catch {
          /* ignore */
        }
        return undefined;
      }
      return entry.value as T;
    },

    async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
      if (!enabled) return;
      await ensureDir();
      const entry: DiskEntry = {
        key,
        savedAt: Date.now(),
        ttlMs: ttlMs ?? defaultTtlMs,
        value,
      };
      await writeFile(pathFor(key), JSON.stringify(entry), "utf8");
    },

    async delete(key: string): Promise<void> {
      if (!enabled) return;
      try {
        await unlink(pathFor(key));
      } catch {
        /* ignore */
      }
    },

    async deleteByPrefix(prefix: string): Promise<number> {
      if (!enabled) return 0;
      await ensureDir();
      let removed = 0;
      let names: string[];
      try {
        names = await readdir(dir);
      } catch {
        return 0;
      }
      for (const name of names) {
        if (!name.endsWith(".json")) continue;
        const full = join(dir, name);
        try {
          const raw = await readFile(full, "utf8");
          const entry = JSON.parse(raw) as DiskEntry;
          if (entry.key?.startsWith(prefix)) {
            await unlink(full);
            removed += 1;
          }
        } catch {
          /* ignore corrupt */
        }
      }
      return removed;
    },

    async clear(): Promise<void> {
      if (!enabled) return;
      await rm(dir, { recursive: true, force: true });
      ready = null;
      await ensureDir();
    },

    async stats(): Promise<DiskStoreStats> {
      if (!enabled) {
        return { dir, enabled: false, count: 0 };
      }
      await ensureDir();
      let count = 0;
      try {
        const names = await readdir(dir);
        for (const name of names) {
          if (name.endsWith(".json")) count += 1;
        }
      } catch {
        count = 0;
      }
      return { dir, enabled: true, count };
    },
  };
}
