# @moto125/content-cache-core

Núcleo de la caché de contenidos de utilizado en la UI de **moto125.cc**.  

Este paquete implementa la lógica principal de hidratación de datos desde Strapi, manejo de snapshots y normalización de errores.

## API

### Hidratación

- `hydrateAllResilient(sdk)`  
  Hidrata todo el contenido de Strapi (artículos, motos, compañías, taxonomías, páginas, config).  
  Devuelve `{ data, errors, timings }`.

### Snapshots

- `saveSnapshot(filePath, state)` → guarda el estado cacheado en un JSON.  
- `loadSnapshot(filePath)` → carga el estado cacheado desde disco.

### Utilidades

- `timed(label, fn, into)` → mide el tiempo de una operación y lo guarda en `into`.  
- `toMirrorError(source, err)` → convierte un error en un `ContentCacheError`.  
- `toBuffer(obj)` / `deserialize(ab)` → serialización binaria vía `v8`.  

### Tipos exportados

- `ContentCacheData` → estructura del contenido cacheado.  
- `ContentCacheError` → error tipado con origen, código y mensaje.  
- `ContentCacheTimings` → métricas de hidratación.  
- `ContentCacheState` → estado completo con datos, tiempos y metadata.  
