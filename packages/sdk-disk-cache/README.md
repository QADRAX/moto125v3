# @moto125/sdk-disk-cache

Caché **disco-first** para envoltorios de [`Moto125Sdk`](../api-client/README.md) (`@moto125/api-client`).  
Cachea **lecturas por entrada** (list/get) en disco con TTL, e **invalida por namespace** tras `create`/`update`.

> Pensado para **Node.js** (MCP, scripts CLI). **No** es un mirror de UI ni sustituye a `@moto125/content-cache`.

---

## Características

- Store en disco con TTL por entrada (`createDiskStore`)
- `wrapWithDiskCache(sdk, options)` — misma superficie que `Moto125Sdk`
- Invalidación por prefijo de namespace en writes
- Prefijos extra (`extraInvalidateOn`) para claves auxiliares (p. ej. scans)
- `enabled: false` → passthrough sin I/O
- Store reutilizable fuera del wrap (informes propios del consumidor)

---

## Instalación

```bash
pnpm add @moto125/sdk-disk-cache
# o en el monorepo:
# "@moto125/sdk-disk-cache": "workspace:*"
```

Depende de `@moto125/api-client` (workspace / peer de tipos).

---

## Inicio rápido

```ts
import { createMoto125Api } from "@moto125/api-client";
import { createDiskStore, wrapWithDiskCache } from "@moto125/sdk-disk-cache";
import { join } from "node:path";
import { homedir } from "node:os";

const store = createDiskStore({
  dir: join(homedir(), ".moto125", "sdk-disk-cache"),
  defaultTtlMs: 300_000,
  enabled: true,
});

const raw = createMoto125Api({
  baseUrl: "https://api.moto125.cc",
  token: process.env.MOTO125_TOKEN ?? null,
});

const sdk = wrapWithDiskCache(raw, {
  store,
  enabled: true,
  extraInvalidateOn: {
    articles: ["scan.articles_broken"],
  },
});

// 1ª llamada → Strapi; 2ª → disco
await sdk.articles.list({ pagination: { page: 1, pageSize: 20 } });
await sdk.articles.list({ pagination: { page: 1, pageSize: 20 } });

// Write → invalida articles.* (+ prefijos extra)
await sdk.articles.update("documentId", { title: "Nuevo" });
```

---

## Ejecutables y *runtime*

- **ESM**: `dist/` (único build)
- **Tipos**: `dist/index.d.ts`
- **Node**: 18+ (recomendado 22 en el monorepo)

```bash
pnpm --filter @moto125/sdk-disk-cache build
```

---

## Superficie de la API

### `createDiskStore(options)`

```ts
const store = createDiskStore({
  dir: "/ruta/cache",
  defaultTtlMs: 300_000,
  enabled: true,
});

await store.set("articles.list:…", value);
const hit = await store.get("articles.list:…");
await store.delete("articles.list:…");
await store.deleteByPrefix("articles.");
await store.clear();
const { count, enabled, dir } = await store.stats();
```

### `wrapWithDiskCache(sdk, options)`

| Opción | Descripción |
|---|---|
| `store` | Store existente (preferido si el consumidor guarda claves propias) |
| `dir` | Si no hay `store`, crea uno aquí |
| `defaultTtlMs` | TTL por defecto |
| `enabled` | `false` = passthrough |
| `extraInvalidateOn` | Mapa namespace → prefijos extra a borrar en write |

**Lecturas cacheadas:** `articles|motos|companies` list/get*; taxonomías `list`; `config.get`; `pages.*.get`.

**Writes:** `create`/`update` → `deleteByPrefix(namespace.)` tras éxito (si el write falla, no invalida).

### `cacheKey(namespace, method, args)`

Clave estable `namespace.method:` + hash SHA-256 corto de args (JSON con claves ordenadas).

---

## Comportamiento (vs content-cache)

| `@moto125/content-cache` | `@moto125/sdk-disk-cache` |
|---|---|
| Hydrate **todo** el CMS en memoria | Solo lo pedido |
| Workers + snapshots UI / Next.js | Disco-first, sin workers |
| Pensado para SSR | Pensado para MCP / scripts |

Media Library (Admin API) **no** forma parte de este wrap.

---

## Tipos

```ts
import type {
  DiskStore,
  DiskStoreOptions,
  DiskStoreStats,
  WrapWithDiskCacheOptions,
} from "@moto125/sdk-disk-cache";
```

---

## Tests

```bash
pnpm --filter @moto125/sdk-disk-cache test
pnpm --filter @moto125/sdk-disk-cache test:coverage
```

Umbrales Vitest: **lines ≥ 85%**, **branches ≥ 75%** sobre `src/` (excl. `index.ts` y `*.test.ts`).
