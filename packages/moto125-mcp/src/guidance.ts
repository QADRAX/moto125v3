/**
 * Guía operativa del MCP (español).
 * Solo documenta lo que ya existe en @moto125/api-client / admin-api-client.
 */

export const FILTROS_ARTICULOS = `
params.filters usa la sintaxis Strapi (pasada tal cual a sdk.articles.list).

Título (parcial, sin mayúsculas):
{ "filters": { "title": { "$containsi": "Yamaha" } } }

Slug exacto:
{ "filters": { "slug": { "$eq": "prueba-yamaha-nmax" } } }

Fecha exacta (publicationDate, YYYY-MM-DD):
{ "filters": { "publicationDate": { "$eq": "2024-06-15" } } }

Rango de fechas:
{ "filters": { "publicationDate": { "$gte": "2024-01-01", "$lte": "2024-12-31" } } }

Tipo de artículo por nombre (relation):
{ "filters": { "articleType": { "name": { "$eq": "PRUEBAS" } } } }

Tipo por documentId:
{ "filters": { "articleType": { "documentId": { "$eq": "abc123..." } } } }

Solo visibles:
{ "filters": { "visible": { "$eq": true } } }

Combinar con $and:
{ "filters": { "$and": [
  { "articleType": { "name": { "$eq": "PRUEBAS" } } },
  { "publicationDate": { "$gte": "2024-01-01" } }
] } }

Paginación recomendada en listados:
{ "pagination": { "page": 1, "pageSize": 25, "withCount": true } }

Para listados ligeros (sin dynamic zone completo):
{ "fields": ["slug","title","publicationDate","visible","publishedAt"],
  "populate": { "articleType": true } }
`.trim();

export const FILTROS_MOTOS = `
params.filters → sdk.motos.list.

Por nombre de modelo:
{ "filters": { "modelName": { "$containsi": "NMAX" } } }

Por fullName:
{ "filters": { "fullName": { "$containsi": "Yamaha" } } }

Por moto125Id:
{ "filters": { "moto125Id": { "$eq": "ext-123" } } }
(o usa motos_get_by_moto125_id)

Por marca (company.name):
{ "filters": { "company": { "name": { "$containsi": "Yamaha" } } } }

Activas:
{ "filters": { "active": { "$eq": true } } }

Por año de generación:
{ "filters": { "year": { "$eq": 2026 } } }

Por normativa / motor:
{ "filters": { "normativa": { "$eq": "Euro 5plus" } } }
{ "filters": { "engineType": { "$eq": "eléctrico" } } }

Nota: el campo precio en el SDK se llama priece (typo histórico).
Campos de ficha: year (integer), normativa (Euro…), engineType (combustión|eléctrico|hibrido).
El año de modelo es year — no se añade al modelName.
`.trim();

export const FILTROS_MARCAS = `
params.filters → sdk.companies.list (en la web: Marcas).

{ "filters": { "name": { "$containsi": "Honda" } } }
{ "filters": { "active": { "$eq": true } } }
`.trim();

export const BLOQUES_CONTENIDO = `
Dynamic zone article.content (ArticleContentBlockInput del SDK):

1) Texto (markdown/HTML en Text — capital T):
{ "__component": "article-content.text-content", "Text": "## Título\\n\\nPárrafo..." }

2) Pros y contras:
{ "__component": "article-content.fortalezas-debilidades",
  "Fortalezas": [{ "value": "Buen consumo" }],
  "Debilidades": [{ "value": "Asiento duro" }] }

3) Prestaciones (claves usadas en UI: acc50m, acc100m, acc400m, acc1000m, acc100kmh, maxSpeed, consumo, autonomia, pesoTotal, repartoTrasero, repartoFrontral):
{ "__component": "article-content.prestaciones",
  "prestaciones": { "maxSpeed": "120", "consumo": "2.5", "autonomia": "250" } }

4) Image grid (en el tipo del SDK no tiene más campos):
{ "__component": "article-content.image-grid-content" }

Tags (preferir Value, como en migraciones):
{ "tags": [{ "Value": "Yamaha" }, { "Value": "125cc" }] }

Relaciones (documentIds):
{ "relatedMotos": { "set": ["docIdMoto1"] },
  "relatedCompanies": { "connect": ["docIdMarca1"] },
  "articleType": "docIdTipo" }

Portada: coverImage = id numérico/string de Media Library (subir antes con media_*).
`.trim();

export const FLUJO_CREAR_ARTICULO = `
Flujo recomendado para crear un artículo completo:

1) article_types_list → elegir documentId del tipo (PRUEBAS, ACTUALIDAD, …).
2) (Opcional) companies_list / motos_list → documentIds para relatedCompanies / relatedMotos.
3) (Opcional) media_upload_from_url o media_upload_local_file con folderPath="post-cover-images", watermark=true y fileInfo={ alternativeText: "..." } → usar id en coverImage.
4) articles_create con slug, title, publicationDate (YYYY-MM-DD), visible, articleType, tags, content[].
5) Revisar con articles_get_by_slug o articles_get_by_id.

Límites del SDK tipado:
- No hay publishedAt en ArticleCreateInput → no hay tool de publicar tipada.
- Defaults del cliente MCP: publicationState=preview, locale=es.
`.trim();

export const SUBIDA_IMAGENES = `
Guía de subida de medios:
- media_upload_local_file: Sube fichero local.
- media_upload_from_url: Descarga directamente desde URL pública y sube a Strapi.
- media_upload_batch: Sube múltiples imágenes (URLs o locales) en lote para galerías.

Opciones comunes:
- folderPath: "post-cover-images" o "motos/marcas/yamaha" (crea automáticamente la carpeta si no existe).
- watermark: true para aplicar el logo oficial SVG de moto125.cc en la esquina inferior derecha con escala proporcional y opacidad elegante, o un objeto { position, opacity, scale, margin }.
- fileInfo: { alternativeText: "Texto SEO y accesibilidad", caption: "Pie de foto" }.
`.trim();

export const MODELO_RECURSOS = `
# Modelo de contenido moto125 (api-client)

## Colecciones
- articles → Artículos (slug, title, publicationDate, visible, coverImage, content DZ, tags, relatedMotos, relatedCompanies, articleType)
- companies → Marcas
- motos → Motos (modelName, moto125Id, year, engineType, normativa, priece, fichaTecnica, images, company, motoType)
- article-types, moto-types, moto-classes → taxonomías

## Singles
- config, home-page, pagina-ofertas, about-us-page

## UI
- Idioma: es. Rutas: /marcas, /motos, /sobre-nosotros, artículos por slug.
- Listados públicos filtran visible !== false.
- Ficha técnica: ver moto125://docs/ficha-tecnica (unidades fijas para el comparador).
`.trim();

/**
 * Unidades canónicas = MotoSpecs / MotoProductJsonLd.
 * El valor en JSON NO lleva unidad; la unidad es implícita por campo.
 */
export const FICHA_TECNICA = `
# fichaTecnica = MotoFichaTecnica (api-client entities)

Fuente de verdad tipada: packages/api-client/src/types/entities.ts
Write path: MotoCreateInput / MotoUpdateInput.fichaTecnica (mismo tipo).
UI: apps/moto125-ui/src/components/motos/MotoSpecs.tsx

## Reglas de precisión (comparador)

1. Nunca convertir unidades al guardar (ni mm↔cm, ni CV↔kW, ni kWh↔Ah).
2. 0 o vacío = “sin dato” en UI; no uses 0 como valor real salvo que sea legítimo.
3. Potencia combustión = horsePower en CV; eléctrica = powerKW / powerPM en kW.
4. compressionRatio = número X (la UI muestra "X:1"); no guardar "10.5:1" como string.
5. Neumáticos = string de balón (ej. "110/70-16"), no diámetro suelto.
6. frontTrainDistribution + rearTrainDistribution ≈ 100 si ambos existen.
7. Typos históricos del schema: Break (brake), Ballon (balloon), longitude (length) — usar esos nombres.

## Chasis / dimensiones

| Campo | Unidad | Etiqueta UI |
|---|---|---|
| width, height, longitude, wheelbase, seatHeight | mm | Ancho, Alto, Longitud, Dist. ejes, Alt. asiento |
| totalWeight | kg | Peso total |
| depositCapacity | L | Depósito |
| frontWheelBallon, rearWheelBallon | texto | Neumático (balón) |
| front/rearBreakDiameter | mm | Diámetro freno |
| front/rearBreakTypeName | texto | Tipo freno |
| rearNumSuspensions | entero | Nº suspensiones traseras |
| front/rearSuspensionTravel | mm | Recorrido suspensión |
| front/rearTrainDistribution | % | Reparto tren |
| frontSuspensionTypeName, motorcycleFrameTypeName, motorcycleFrameMaterialName | texto | |

## combustionEngine

| Campo | Unidad |
|---|---|
| engineDisplacement | cc |
| horsePower | CV |
| powerRPM | rpm |
| maxTorqueNP | N·m |
| maxTorqueRPM | rpm |
| pistonDiameter, pistonStroke | mm |
| compressionRatio | ratio X (:1 en UI) |
| numberOfCylinders | entero |
| fuelFeedingName, distributionName, refrigerationName, ignitionType, gearboxName | texto |

## electricEngine

| Campo | Unidad |
|---|---|
| powerKW | kW (continuo) |
| powerPM | kW (pico) |
| torque | N·m |
| rpm | rpm |
| batteryVolts | V |
| batteryCapacity | kWh |
| numberOfMotors | entero |
| batteryName | texto |

## Update parcial

motos_update con fichaTecnica sustituye el JSON completo del campo.
Para merge: leer moto → fusionar objeto → update con ficha completa.
`.trim();

