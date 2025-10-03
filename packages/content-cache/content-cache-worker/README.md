# @moto125/content-cache-worker

Worker de **caché de contenidos** para la UI de **moto125.cc**.

Este paquete implementa el **worker thread** que se encarga de la hidratación de datos desde Strapi, así como la carga y guardado de snapshots, de manera **aislada del proceso principal**.

---

## API de mensajes soportados

El worker recibe y responde a mensajes (`ContentCacheWorkerIn` → `ContentCacheWorkerOut`).

### Mensajes de entrada (`ContentCacheWorkerIn`)

- `{ type: "hydrate", sdkInit }` → hidrata contenido desde Strapi.  
- `{ type: "saveSnapshot", path, stateBin }` → guarda snapshot en disco.  
- `{ type: "loadSnapshot", path }` → carga snapshot desde disco.  
- `{ type: "setDebug", enabled }` → activa/desactiva logging detallado.  
- `{ type: "dispose" }` → libera recursos del worker.  

### Mensajes de salida (`ContentCacheWorkerOut`)

- `{ type: "hydrate:done", payload }` → estado cacheado serializado.  
- `{ type: "saveSnapshot:done" }` → snapshot guardado con éxito.  
- `{ type: "loadSnapshot:done", payload }` → snapshot cargado.  
- `{ type: "saveSnapshot:error", error }` → error al guardar snapshot.  
- `{ type: "loadSnapshot:error", error }` → error al cargar snapshot.  
- `{ type: "error", error }` → error inesperado en el worker.  

---

## Debug logging

Cuando se activa con `{ type: "setDebug", enabled: true }`, el worker muestra en consola:  
- Tamaño total del estado cacheado (bytes y formato humano).  
- Conteo de elementos por colección (artículos, motos, compañías, etc.).  
- Tiempos de hidratación globales y por fuente.  
- Tamaño aproximado de snapshots al guardarse o cargarse.  

Ejemplo de salida con `console.table`:

```
┌────────────────────────────┬──────────┬───────────┐
│ key                        │ value    │ timing    │
├────────────────────────────┼──────────┼───────────┤
│ content.articles           │ 124      │ 320 ms    │
│ content.motos              │ 56       │ 210 ms    │
│ pages.home                 │ true     │ 45 ms     │
│ timing.hydrate.totalMs     │ -        │ 1320 ms   │
│ sizeHuman                  │ 2.1 MB   │ -         │
└────────────────────────────┴──────────┴───────────┘
```

---