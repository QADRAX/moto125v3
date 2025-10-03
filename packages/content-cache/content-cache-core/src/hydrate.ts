import type { Moto125Sdk } from "@moto125/api-client";
import type {
  ContentCacheData,
  ContentCacheError,
  ContentCacheTimings,
} from "./types";
import { fetchAllCollection, safeSingle } from "./strapi";
import { performance } from "node:perf_hooks";
import { timed, toMirrorError } from "./utils";

export async function hydrateAllResilient(sdk: Moto125Sdk): Promise<{
  data: ContentCacheData;
  errors: ContentCacheError[];
  timings: ContentCacheTimings;
}> {
  const errors: ContentCacheError[] = [];
  const bySource: Record<string, number> = {};

  const startedAt = new Date().toISOString();
  const tAll0 = performance.now();

  const data: ContentCacheData = {
    articles: [],
    motos: [],
    companies: [],
    taxonomies: { articleTypes: [], motoTypes: [], motoClasses: [] },
    pages: {},
    config: undefined,
  };

  const jobs: Array<Promise<void>> = [
    (async () => {
      try {
        data.articles = await timed(
          "articles",
          () => fetchAllCollection(sdk.articles.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("articles", e));
        data.articles = [];
      }
    })(),
    (async () => {
      try {
        data.motos = await timed(
          "motos",
          () => fetchAllCollection(sdk.motos.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("motos", e));
        data.motos = [];
      }
    })(),
    (async () => {
      try {
        data.companies = await timed(
          "companies",
          () => fetchAllCollection(sdk.companies.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("companies", e));
        data.companies = [];
      }
    })(),
    (async () => {
      try {
        data.taxonomies.articleTypes = await timed(
          "taxonomies.articleTypes",
          () => fetchAllCollection(sdk.taxonomies.articleTypes.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("taxonomies.articleTypes", e));
        data.taxonomies.articleTypes = [];
      }
    })(),
    (async () => {
      try {
        data.taxonomies.motoTypes = await timed(
          "taxonomies.motoTypes",
          () => fetchAllCollection(sdk.taxonomies.motoTypes.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("taxonomies.motoTypes", e));
        data.taxonomies.motoTypes = [];
      }
    })(),
    (async () => {
      try {
        data.taxonomies.motoClasses = await timed(
          "taxonomies.motoClasses",
          () => fetchAllCollection(sdk.taxonomies.motoClasses.list),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("taxonomies.motoClasses", e));
        data.taxonomies.motoClasses = [];
      }
    })(),
    (async () => {
      try {
        data.pages.home = await timed(
          "pages.home",
          () => safeSingle((p) => sdk.pages.home.get(p)),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("pages.home", e));
        data.pages.home = undefined;
      }
    })(),
    (async () => {
      try {
        data.pages.ofertas = await timed(
          "pages.ofertas",
          () => safeSingle((p) => sdk.pages.ofertas.get(p)),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("pages.ofertas", e));
        data.pages.ofertas = undefined;
      }
    })(),
    (async () => {
      try {
        data.pages.aboutUs = await timed(
          "pages.aboutUs",
          () => safeSingle((p) => sdk.pages.aboutUs.get(p)),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("pages.aboutUs", e));
        data.pages.aboutUs = undefined;
      }
    })(),
    (async () => {
      try {
        data.config = await timed(
          "config",
          () => safeSingle((p) => sdk.config.get(p)),
          bySource
        );
      } catch (e) {
        errors.push(toMirrorError("config", e));
        data.config = undefined;
      }
    })(),
  ];

  await Promise.all(jobs);

  const totalMs = performance.now() - tAll0;
  const endedAt = new Date().toISOString();

  return {
    data,
    errors,
    timings: {
      hydrate: {
        startedAt,
        endedAt,
        totalMs: Math.round(totalMs),
        bySource: Object.fromEntries(
          Object.entries(bySource).map(([k, v]) => [k, Math.round(v)])
        ),
      },
    },
  };
}
