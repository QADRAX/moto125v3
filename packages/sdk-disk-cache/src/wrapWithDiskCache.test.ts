import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Moto125Sdk } from "@moto125/api-client";
import { createDiskStore } from "./diskStore.js";
import { wrapWithDiskCache } from "./wrapWithDiskCache.js";

function createFakeSdk() {
  const articlesList = vi.fn(async () => ({ data: [{ id: 1 }], meta: {} }));
  const articlesGetById = vi.fn(async () => ({ data: { id: 1 }, meta: {} }));
  const articlesUpdate = vi.fn(async () => ({ data: { id: 1 }, meta: {} }));
  const articlesCreate = vi.fn(async () => ({ data: { id: 2 }, meta: {} }));

  const sdk = {
    http: {} as Moto125Sdk["http"],
    articles: {
      list: articlesList,
      getBySlug: vi.fn(),
      getById: articlesGetById,
      create: articlesCreate,
      update: articlesUpdate,
    },
    motos: {
      list: vi.fn(async () => ({ data: [], meta: {} })),
      getByMoto125Id: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    companies: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    taxonomies: {
      articleTypes: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
      motoTypes: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
      motoClasses: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
    },
    config: { get: vi.fn(), update: vi.fn() },
    pages: {
      home: { get: vi.fn(), update: vi.fn() },
      ofertas: { get: vi.fn(), update: vi.fn() },
      aboutUs: { get: vi.fn(), update: vi.fn() },
    },
  } as unknown as Moto125Sdk;

  return { sdk, articlesList, articlesGetById, articlesUpdate, articlesCreate };
}

describe("wrapWithDiskCache", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "sdk-wrap-cache-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("1ª list llama fake; 2ª es hit", async () => {
    const { sdk, articlesList } = createFakeSdk();
    const wrapped = wrapWithDiskCache(sdk, {
      dir,
      defaultTtlMs: 60_000,
      enabled: true,
    });
    const params = { pagination: { page: 1 } };
    await wrapped.articles.list(params);
    await wrapped.articles.list(params);
    expect(articlesList).toHaveBeenCalledTimes(1);
  });

  it("update invalida prefix articles → siguiente list miss", async () => {
    const { sdk, articlesList, articlesUpdate } = createFakeSdk();
    const wrapped = wrapWithDiskCache(sdk, {
      dir,
      defaultTtlMs: 60_000,
      enabled: true,
    });
    await wrapped.articles.list({ page: 1 });
    await wrapped.articles.update("doc1", { title: "x" });
    expect(articlesUpdate).toHaveBeenCalledTimes(1);
    await wrapped.articles.list({ page: 1 });
    expect(articlesList).toHaveBeenCalledTimes(2);
  });

  it("extraInvalidateOn limpia claves auxiliares en write", async () => {
    const store = createDiskStore({ dir, defaultTtlMs: 60_000, enabled: true });
    await store.set("scan.articles_broken:preview", { broken: [] });
    const { sdk } = createFakeSdk();
    const wrapped = wrapWithDiskCache(sdk, {
      store,
      enabled: true,
      extraInvalidateOn: { articles: ["scan.articles_broken"] },
    });
    await wrapped.articles.update("doc1", { title: "x" });
    await expect(store.get("scan.articles_broken:preview")).resolves.toBeUndefined();
  });

  it("enabled: false siempre llama al fake", async () => {
    const { sdk, articlesList } = createFakeSdk();
    const wrapped = wrapWithDiskCache(sdk, {
      dir,
      defaultTtlMs: 60_000,
      enabled: false,
    });
    await wrapped.articles.list({ page: 1 });
    await wrapped.articles.list({ page: 1 });
    expect(articlesList).toHaveBeenCalledTimes(2);
  });

  it("write que falla no invalida", async () => {
    const { sdk, articlesList, articlesUpdate } = createFakeSdk();
    articlesUpdate.mockRejectedValueOnce(new Error("boom"));
    const wrapped = wrapWithDiskCache(sdk, {
      dir,
      defaultTtlMs: 60_000,
      enabled: true,
    });
    await wrapped.articles.list({ page: 1 });
    await expect(wrapped.articles.update("doc1", { title: "x" })).rejects.toThrow(
      "boom"
    );
    await wrapped.articles.list({ page: 1 });
    expect(articlesList).toHaveBeenCalledTimes(1);
  });

  it("create también invalida tras éxito", async () => {
    const { sdk, articlesList, articlesCreate } = createFakeSdk();
    const wrapped = wrapWithDiskCache(sdk, {
      dir,
      defaultTtlMs: 60_000,
      enabled: true,
    });
    await wrapped.articles.list({});
    await wrapped.articles.create({ slug: "a", title: "t", articleType: "x" } as never);
    expect(articlesCreate).toHaveBeenCalledTimes(1);
    await wrapped.articles.list({});
    expect(articlesList).toHaveBeenCalledTimes(2);
  });
});
