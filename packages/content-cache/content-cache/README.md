# @moto125/content-cache

Cliente de **caché de contenidos de Strapi v5** para la **UI** de **moto125.cc**.  

Este paquete se ejecuta en el entorno de servidor de Next.js y permite hidratar una cache completa del contenido de Strapi, refrescarla en segundo plano y arrancarla desde snapshots en disco.

---

## Características

- **Hidratación** desde Strapi usando `@moto125/api-client` (vía `content-cache-core`)
- **Snapshots** en disco para arranque rápido en SSR
- **Scheduler configurable** (intervalos o cron) para refresco automático
- **Worker threads** para aislar la lógica de carga y snapshots
- API tipada con interfaces de `@moto125/content-cache-core`
- Gestión centralizada de errores mediante `ErrorBus`
- Reactividad: listeners de actualización (`onUpdate`) y errores (`onError`)

---

## Uso básico en un proceso Node

```ts
import { createAndStartContentCache } from '@moto125/content-cache';

// Crear e iniciar el caché de contenidos
const cache = await createAndStartContentCache({
  sdkInit: { baseURL: 'https://api.moto125.cc', token: process.env.STRAPI_TOKEN },
  snapshotPath: './.cache/content-snapshot.json',
  autosave: true,
  refreshIntervalMs: 60_000, // refrescar cada minuto
  // refreshCron: '0 * * * *', // alternativa: cada hora
  // cronTimezone: 'Europe/Madrid',
  workerDebugLogging: false,
});

// Escuchar actualizaciones
cache.onUpdate((state) => {
  console.log('Estado cacheado actualizado:', state);
});

// Escuchar errores
cache.onError((err) => {
  console.error('Error en ContentCache:', err);
});
```

---

## API principal

### Creación

- `createContentCache()` → instancia sin inicializar.
- `createAndStartContentCache(opts)` → crea e inicializa con scheduler.

### Métodos de `ContentCache`

- `init(opts)` → inicializa el worker, carga snapshot o hidrata.
- `state()` → devuelve el estado actual del mirror.
- `onUpdate(listener)` → suscribirse a cambios de estado.
- `onError(listener)` → suscribirse a errores.
- `getErrors()` / `clearErrors()` → gestión manual de errores.
- `refresh()` → fuerza una rehidratación inmediata.
- `start()` / `stop()` → control del scheduler.
- `saveSnapshot()` / `loadSnapshot()` → persistir/restaurar snapshot manualmente.
- `configure(opts)` → reconfigurar opciones en caliente.
- `setWorkerDebugLogging(enabled)` → activar logs de debug del worker.
- `dispose()` → liberar recursos.

---

## Scheduler

Dos modos de refresco automático:

- **Intervalo fijo**:
  ```ts
  { refreshIntervalMs: 60_000 }
  ```

- **Expresión cron**:
  ```ts
  { refreshCron: '0 * * * *', cronTimezone: 'Europe/Madrid' }
  ```

El scheduler puede reconfigurarse dinámicamente en tiempo de ejecución con `cache.configure(...)`.

---

## Snapshots en disco

- Permiten **arrancar más rápido** la cache en situaciones para hot reloading de la UI en situaciones de reinicio o update.
- Se guardan en un fichero JSON definido en `snapshotPath`.
- Si se activa `autosave: true`, cada refresco exitoso guarda snapshot automáticamente.

---
