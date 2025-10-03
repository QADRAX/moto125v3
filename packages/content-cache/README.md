# @moto125/content-cache

Sistema de **cacheo de contenido** para la **UI de moto125.cc**.  
Este paquete se usa en el cliente (Node/Next) para hidratar una cache de contenido en memoria, refrescarla en segundo plano y arrancarla rápidamente desde un snapshot en disco.

---

## Arquitectura

La implementación consta de tres packages:

### `@moto125/content-cache-core`
- Define **tipos compartidos** (`MirrorState`, `MirrorError`, `MirrorWorkerIn/Out`, etc.).
- Implementa la lógica de **hydrate** contra Strapi usando [`@moto125/api-client`](https://github.com/...).
- Incluye utilidades: medición de tiempos, conversión de errores (`toMirrorError`), snapshot en disco.

### `@moto125/content-cache-worker`
- Ejecutado en un **worker thread de Node.js**.
- Atiende mensajes (`hydrateAllResilient`, `saveSnapshot`, `loadSnapshot`).
- Comunica resultados a través de `parentPort`.

### `@moto125/content-cache`
- Implementa `DataMirrorImpl`:
  - Arranca el worker y gestiona la comunicación.
  - Publica estado y errores vía `MirrorErrorBus`.
  - Maneja snapshots en disco (para arranque rápido).
  - Scheduler configurable: intervalo o cron.
- Helpers:
  - `createDataMirror` → crea instancia sin iniciar.
  - `createAndStartDataMirror` → crea y arranca con scheduler.

---