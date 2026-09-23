import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDiskStore } from "@moto125/sdk-disk-cache";
import {
  brokenScanCacheKey,
  getOrRunBrokenScan,
  getOrRunImageIssuesScan,
  imageIssuesScanCacheKey,
} from "./brokenScanCache.js";

describe("brokenScanCache", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "mcp-scan-cache-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("brokenScanCacheKey incluye publicationState y límites", () => {
    expect(
      brokenScanCacheKey({
        publicationState: "preview",
        pageSize: 50,
        maxPages: 20,
      })
    ).toBe("scan.articles_broken:preview:s50:p20");
  });

  it("imageIssuesScanCacheKey usa prefijo propio", () => {
    expect(
      imageIssuesScanCacheKey({
        publicationState: "preview",
        pageSize: 50,
        maxPages: 20,
      })
    ).toBe("scan.articles_image_issues:preview:s50:p20");
  });

  it("1ª run ejecuta; 2ª hit de caché", async () => {
    const store = createDiskStore({ dir, defaultTtlMs: 60_000, enabled: true });
    const run = vi.fn(async () => ({ brokenCount: 1 }));
    const opts = {
      publicationState: "preview" as const,
      pageSize: 10,
      maxPages: 2,
    };
    const a = await getOrRunBrokenScan(store, opts, run);
    const b = await getOrRunBrokenScan(store, opts, run);
    expect(a.fromCache).toBe(false);
    expect(b.fromCache).toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
    expect(b.result).toEqual({ brokenCount: 1 });
  });

  it("image issues cache es independiente del broken", async () => {
    const store = createDiskStore({ dir, defaultTtlMs: 60_000, enabled: true });
    const brokenRun = vi.fn(async () => ({ kind: "broken" }));
    const imageRun = vi.fn(async () => ({ kind: "images" }));
    const opts = {
      publicationState: "preview" as const,
      pageSize: 10,
      maxPages: 1,
    };
    await getOrRunBrokenScan(store, opts, brokenRun);
    const img = await getOrRunImageIssuesScan(store, opts, imageRun);
    expect(img.fromCache).toBe(false);
    expect(imageRun).toHaveBeenCalledTimes(1);
    const img2 = await getOrRunImageIssuesScan(store, opts, imageRun);
    expect(img2.fromCache).toBe(true);
    expect(imageRun).toHaveBeenCalledTimes(1);
  });

  it("force: true salta caché", async () => {
    const store = createDiskStore({ dir, defaultTtlMs: 60_000, enabled: true });
    const run = vi.fn(async () => ({ n: run.mock.calls.length }));
    const opts = {
      publicationState: "live" as const,
      pageSize: 5,
      maxPages: 1,
    };
    await getOrRunBrokenScan(store, opts, run);
    const forced = await getOrRunBrokenScan(store, { ...opts, force: true }, run);
    expect(forced.fromCache).toBe(false);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
