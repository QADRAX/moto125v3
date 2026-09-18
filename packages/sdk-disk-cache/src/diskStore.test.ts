import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDiskStore, type DiskStore } from "./diskStore.js";

describe("createDiskStore", () => {
  let dir: string;
  let store: DiskStore;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "sdk-disk-cache-"));
    store = createDiskStore({ dir, defaultTtlMs: 60_000, enabled: true });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("set → get hit", async () => {
    await store.set("articles.list:abc", { items: [1] });
    await expect(store.get("articles.list:abc")).resolves.toEqual({ items: [1] });
  });

  it("get miss si no existe", async () => {
    await expect(store.get("missing")).resolves.toBeUndefined();
  });

  it("TTL expirado → miss y limpia entrada", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await store.set("k", { v: 1 }, 1_000);
    vi.setSystemTime(new Date("2026-01-01T00:00:02Z"));
    await expect(store.get("k")).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it("delete elimina la entrada", async () => {
    await store.set("k", 1);
    await store.delete("k");
    await expect(store.get("k")).resolves.toBeUndefined();
  });

  it("deleteByPrefix elimina solo el prefijo", async () => {
    await store.set("articles.list:a", 1);
    await store.set("articles.getById:b", 2);
    await store.set("motos.list:c", 3);
    await store.deleteByPrefix("articles.");
    await expect(store.get("articles.list:a")).resolves.toBeUndefined();
    await expect(store.get("articles.getById:b")).resolves.toBeUndefined();
    await expect(store.get("motos.list:c")).resolves.toBe(3);
  });

  it("clear vacía el store", async () => {
    await store.set("a", 1);
    await store.set("b", 2);
    await store.clear();
    await expect(store.get("a")).resolves.toBeUndefined();
    await expect(store.get("b")).resolves.toBeUndefined();
    const stats = await store.stats();
    expect(stats.count).toBe(0);
  });

  it("stats refleja count y enabled", async () => {
    await store.set("a", 1);
    await store.set("b", 2);
    const stats = await store.stats();
    expect(stats.enabled).toBe(true);
    expect(stats.count).toBe(2);
    expect(stats.dir).toBe(dir);
  });

  it("enabled: false → get siempre miss y set no persiste", async () => {
    const off = createDiskStore({ dir, defaultTtlMs: 60_000, enabled: false });
    await off.set("k", 1);
    await expect(off.get("k")).resolves.toBeUndefined();
    const stats = await off.stats();
    expect(stats.enabled).toBe(false);
    expect(stats.count).toBe(0);
  });
});
