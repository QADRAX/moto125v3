# @moto125/migration

Paquete de **scripts de migración** y **backfill** utilizados para mover contenido de **WordPress** a **Strapi v5** en **moto125.cc**.

> **Fuera del workspace pnpm/turbo:** este directorio no participa en `pnpm install` ni en `pnpm build` del monorepo (evita conflictos de tipos con `jsdom` bajo pnpm). El código en `src/` se conserva. Para volver a usarlo como paquete, renombra `package.json.off-workspace` → `package.json` y quita `!packages/migration` de [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml).

---

## Propósito

Este paquete incluye utilidades y scripts internos que apoyan en la migración y normalización de contenido hacia Strapi, aprovechando los clientes:

- [`@moto125/api-client`](../api-client/README.md)  
- [`@moto125/admin-api-client`](../admin-api-client/README.md)  
- [`@moto125/content-cache`](../content-cache/README.md)  

Está pensado únicamente para **procesos internos de migración y mantenimiento**, no para uso en producción.

---

## Dependencias clave

- **MySQL2** → conexión con la base de datos de WordPress.  
- **Azure Blob Storage** → migración de ficheros multimedia.  
- **Axios + Cheerio + JSDOM** → procesamiento de HTML.  
- **xml2js** → parseo de feeds y exportaciones XML.  
- **fs-extra** → operaciones de sistema de ficheros.  
- **dompurify** → sanitización de HTML antes de importarlo.  
