![](./logo.png)

[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-orange.svg)](LICENSE)

---

Este repositorio contiene el código fuente de **moto125.cc**, revista en español sobre motocicletas de 125cc.  
Tras pasar por **Joomla** y **WordPress**, esta tercera versión usa **Strapi v5** como *headless CMS* y **Next.js 14** como frontend, con un **sistema de caché de contenido en memoria** para SSR rápido y resiliente.

> ⚠️ **Importante**: aquí sólo está la **arquitectura técnica** (código). El **contenido editorial** (artículos, imágenes y base de datos) es privado y no forma parte del repo.

## Estructura del monorepo

Monorepo con **npm workspaces**. Cada paquete tiene su propio README con detalles.

```
moto125v3/
├── apps/
│   ├── moto125-strapi/      # Backend (Strapi v5)
│   └── moto125-ui/          # Frontend (Next.js 14)
└── packages/
    ├── admin-api-client/    # Cliente Admin API de Strapi
    ├── api-client/          # SDK tipado para API pública
    ├── content-cache/       # Sistema de caché
    └── migration/           # Scripts internos de migración/backfill
```

### Documentación por módulo

- **Apps**
  - **UI (Next.js)** → [`apps/moto125-ui/README.md`](apps/moto125-ui/README.md)
  - **Strapi (CMS)** → [`apps/moto125-strapi/README.md`](apps/moto125-strapi/README.md)

- **Paquetes**
  - **API pública** → [`packages/api-client/README.md`](packages/api-client/README.md)
  - **Admin API** → [`packages/admin-api-client/README.md`](packages/admin-api-client/README.md)
  - **Content Cache** → [`packages/content-cache/README.md`](packages/content-cache/README.md)
    - Cliente (Next/Node) → [`packages/content-cache/content-cache/README.md`](packages/content-cache/content-cache/README.md)
    - Núcleo (tipos + hydrate + snapshots) → [`packages/content-cache/content-cache-core/README.md`](packages/content-cache/content-cache-core/README.md)
    - Worker thread (hidratación + IO) → [`packages/content-cache/content-cache-worker/README.md`](packages/content-cache/content-cache-worker/README.md)
  - **Migración / backfill** → [`packages/migration/README.md`](packages/migration/README.md)


## Licencia

Publicado bajo **Business Source License (BUSL‑1.1)**.  

El código es visible para aprendizaje y colaboración; **el uso comercial está restringido** salvo autorización expresa.
