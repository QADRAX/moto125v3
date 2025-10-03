# @moto125/content-cache

Sistema de **cacheo de contenido de Strapi v5** para la **UI de moto125.cc**.  
Permite **hidratar en memoria** todo el contenido del CMS, refrescarlo periódicamente en segundo plano y arrancar rápidamente desde **snapshots persistidos en disco**.  

Está diseñado para ejecutarse en **Next.js (SSR)** y mejorar el rendimiento y resiliencia de la UI.

---

## Motivación

En una aplicación como **moto125.cc**, con un CMS Strapi v5, es crítico que la UI pueda:  
- Responder rápido a peticiones incluso si Strapi está momentáneamente lento o caído.  
- Evitar múltiples llamadas redundantes al CMS en cada render.  
- Tener datos listos en memoria para servir **SSR inmediato**.  
- Ejecutar operaciones costosas de hidratación en **threads aislados**, evitando bloquear el event loop.  

Este sistema resuelve lo anterior con:  
- **Cache en memoria** con estado tipado.  
- **Refresco automático** configurable (intervalo o cron).  
- **Snapshots en disco** para arranques fríos más rápidos.  
- **Workers** que ejecutan en segundo plano la hidratación y persistencia.  

---

## Arquitectura

El sistema se divide en **tres paquetes internos**:

### [`@moto125/content-cache-core`](./content-cache-core/README.md)
- Define los **tipos compartidos** (`ContentCacheState`, `ContentCacheError`, `ContentCacheWorkerIn/Out`, etc.).  
- Implementa la lógica de **hidratación resiliente** (`hydrateAllResilient`) contra Strapi usando [`@moto125/api-client`](https://github.com/...).  
- Incluye utilidades:  
  - Medición de tiempos.  
  - Conversión de errores a formato unificado.  
  - Serialización/deserialización vía `v8`.  
  - Guardado/carga de **snapshots** en disco.  

### [`@moto125/content-cache-worker`](./content-cache-worker/README.md)
- Ejecutado en un **worker thread de Node.js**.  
- Encargado de:  
  - Hidratar contenido desde Strapi en segundo plano.  
  - Guardar/cargar snapshots en disco.  
  - Comunicar resultados al proceso principal vía `parentPort`.  
- Soporta **debug logging** para inspeccionar tiempos, tamaños y cantidades de elementos.

### [`@moto125/content-cache`](./content-cache/README.md)
- Cliente de alto nivel para **Next.js / Node**.  
- Expone la clase principal `ContentCacheImpl` con API reactiva:  
  - `onUpdate(listener)` para recibir cambios de estado.  
  - `onError(listener)` para errores centralizados.  
  - Métodos de control (`refresh`, `start`, `stop`, `dispose`, etc.).  
- Gestiona el **scheduler** configurable (intervalo fijo o cron).  
- Orquesta la comunicación con el worker y maneja snapshots.  

---

## Uso típico

```ts
import { createAndStartContentCache } from "@moto125/content-cache";

// Crear e iniciar el caché de contenidos
const cache = await createAndStartContentCache({
  sdkInit: { baseURL: "https://api.moto125.cc", token: process.env.STRAPI_TOKEN },
  snapshotPath: "./.cache/content-snapshot.json",
  autosave: true,
  refreshIntervalMs: 60_000, // refrescar cada minuto
  workerDebugLogging: false,
});

// Suscribirse a actualizaciones
cache.onUpdate((state) => {
  console.log("Estado actualizado:", state?.data?.motos?.length, "motos");
});

// Manejar errores
cache.onError((err) => {
  console.error("Error en ContentCache:", err);
});
```

---

## Documentación detallada

- 📦 [@moto125/content-cache-core](./content-cache-core/README.md) → Tipos, utilidades y lógica de hidratación.  
- 🧵 [@moto125/content-cache-worker](./content-cache-worker/README.md) → Worker thread para hidratación y snapshots.  
- ⚡ [@moto125/content-cache](./content-cache/README.md) → Cliente de alto nivel para Next.js/Node.  

---