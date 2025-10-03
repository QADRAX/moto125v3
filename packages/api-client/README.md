# @moto125/api-client

Cliente tipado + SDK para **moto125.cc** (Strapi v5).  
Envuelve los endpoints REST con una interfaz limpia y con nombres por dominio, e incluye tipos de TypeScript de primera clase.

> Funciona en Node.js y en navegadores. Incluye builds **ESM** y **CJS**.

---

## Características

- *Factory* simple `createMoto125Api()` para obtener un SDK listo para usar
- Autenticación por **Bearer token**
- `queryDefaults` globales (p. ej. `publicationState`, `locale`) aplicados a cada llamada
- Tipos de TypeScript para entidades, *inputs* y respuestas Strapi
- `http` de bajo nivel expuesto para peticiones personalizadas
- Constructor de *query string* minimalista (`qs`) para `populate`, `filters`, `sort`, `pagination`, etc.
- Utilidades: `normalizePrestaciones`, `parseAccMetric`

---

## Instalación

```bash
npm i @moto125/api-client
# o
pnpm add @moto125/api-client
# o
yarn add @moto125/api-client
```

---

## Inicio rápido

```ts
import { createMoto125Api } from '@moto125/api-client';

const sdk = createMoto125Api({
  baseUrl: 'https://api.moto125.cc',        // <- sin barra final
  token: process.env.MOTO125_TOKEN ?? null, // opcional
  queryDefaults: {
    publicationState: 'live',
    locale: 'es',
  },
});

// Listar artículos con *populate* y *sort* por defecto
const articles = await sdk.articles.list();

// Obtener 1 artículo por slug (devuelve 0/1 items en una "collection")
const one = await sdk.articles.getBySlug('mi-articulo');

// Crear una Moto
const created = await sdk.motos.create({
  modelName: 'Speedster 125',
  moto125Id: 'ext-123',
  active: true,
  motoType: 'documentId-de-motoType',
});
```

---

## Ejecutables y *runtime*

- **ESM**: `dist/esm` (ruta por defecto de importación)  
- **CJS**: `dist/cjs`  
- **Tipos**: `dist/esm/index.d.ts`  

Requiere una implementación de `fetch`:
- **Browser**: `fetch` nativo.
- **Node**: Node 18+ ya incluye `fetch`. En versiones anteriores, pasa `fetchImpl` en las opciones del cliente.

---

## Autenticación

Pasa un **Bearer token** si tu API lo exige:

```ts
const sdk = createMoto125Api({ baseUrl, token: 'JWT_O_PAT' });
// Puedes rotarlo más tarde:
sdk.http.setToken('NUEVO_TOKEN');
```

---

## Superficie del SDK

El SDK agrupa recursos por dominio. Todos los métodos aceptan parámetros **Strapi** opcionales que se mezclan con tus `queryDefaults` globales (los parámetros por llamada tienen prioridad).

```ts
import type { Moto125Sdk } from '@moto125/api-client';
const sdk: Moto125Sdk = createMoto125Api({ baseUrl });
```

### Artículos

```ts
// Listar
await sdk.articles.list({ pagination: { page: 1, pageSize: 20 } });

// Obtener por slug (collection con 0/1 elementos)
await sdk.articles.getBySlug('honda-xxx');

// Obtener por documentId (single)
await sdk.articles.getById('abc123');

// Crear / Actualizar
await sdk.articles.create({
  slug: 'mi-slug',
  title: 'Hola Moto',
  articleType: 'articleTypeDocumentId',
  content: [{ __component: 'article-content.text-content', Text: '...' }],
});

await sdk.articles.update('abc123', { title: 'Nuevo título' });
```

### Motos

```ts
await sdk.motos.list({ sort: ['modelName:asc'] });
await sdk.motos.getByMoto125Id('legacy-42');  // filtra por id externo
await sdk.motos.getById('def456');

await sdk.motos.create({
  modelName: 'Speedster 125',
  moto125Id: 'legacy-42',
  motoType: 'motoTypeDocumentId',
  company: 'companyDocumentId',
});

await sdk.motos.update('def456', { description: 'Actualizado' });
```

### Empresas (*Companies*)

```ts
await sdk.companies.list();
await sdk.companies.getById('cmp789');

await sdk.companies.create({ name: 'Acme Motors', url: 'https://acme.example' });
await sdk.companies.update('cmp789', { phone: '+34 600 000 000' });
```

### Taxonomías

```ts
// Article Types
await sdk.taxonomies.articleTypes.list();
await sdk.taxonomies.articleTypes.create({ name: 'Comparativa' });
await sdk.taxonomies.articleTypes.update('id123', { name: 'Prueba' });

// Moto Types & Classes
await sdk.taxonomies.motoTypes.list();
await sdk.taxonomies.motoClasses.list();
```

### Configuración del sitio (single type)

```ts
await sdk.config.get();
await sdk.config.update({ siteName: 'moto125.cc' });
```

### Páginas (single types)

```ts
await sdk.pages.home.get();
await sdk.pages.home.update({
  featuredArticles: { featuredArticle1: 'articleDocId' },
});

await sdk.pages.ofertas.get();
await sdk.pages.ofertas.update({ title: 'Ofertas del mes' });

await sdk.pages.aboutUs.get();
await sdk.pages.aboutUs.update({ content: 'Sobre nosotros...' });
```

---

## Consultas Strapi: `filters`, `populate`, `sort`, `pagination`

Este cliente sigue las convenciones de **Strapi v5**. Puedes pasar cualquier `StrapiQueryParams`:

```ts
// Filtros
await sdk.articles.list({
  filters: { visible: { $eq: true }, articleType: { documentId: { $eq: 'typeId' } } },
});

// Populate
await sdk.motos.list({
  populate: {
    images: true,
    company: true,
    motoType: { populate: ['motoClass'] },
  },
});

// Ordenación
await sdk.articles.list({ sort: ['publicationDate:desc', 'createdAt:desc'] });

// Paginación
await sdk.articles.list({
  pagination: { page: 2, pageSize: 12, withCount: true },
});
```

> El SDK ya aplica *populate* y *sort* razonables en algunos endpoints (Artículos, Motos, Companies). Puedes sobrescribirlos por llamada.

**Defaults globales** en la creación del SDK:

```ts
const sdk = createMoto125Api({
  baseUrl,
  queryDefaults: { publicationState: 'live', locale: 'es' },
});
```

---

## Creación / actualización de contenido

Los *inputs* reflejan tus tipos de contenido de Strapi. Envía **solo** los campos que quieras crear/actualizar.

```ts
// Crear Artículo con *dynamic zones*
await sdk.articles.create({
  slug: 'prueba-1',
  title: 'Prueba',
  articleType: 'articleTypeDocId',
  tags: [{ value: '125cc' }, { value: 'scooter' }],
  content: [
    { __component: 'article-content.text-content', Text: 'Cuerpo...' },
    { __component: 'article-content.prestaciones', prestaciones: { acc50m: '4,8 s' } },
  ],
});

// Actualizar (parcial)
await sdk.articles.update('docId', { title: 'Nuevo título' });
```

**Relaciones** aceptan *document IDs* (strings) o **objetos de conexión** en relaciones de lista:

```ts
// Conectar / desconectar listas relacionales
await sdk.articles.update('docId', {
  relatedMotos: { connect: ['motoDocId1', 'motoDocId2'] },
});
```

Los campos de **media** aceptan un id numérico o `documentId` (string), según aplique.

---

## Manejo de errores

Los helpers HTTP lanzan en respuestas no-2xx, y adjuntan `status` + `detail` (si está disponible).

```ts
try {
  const res = await sdk.articles.list();
} catch (err: any) {
  console.error('Error:', err.message);  // p. ej., "HTTP 401 Unauthorized"
  console.error('Status:', err.status);  // número
  console.error('Detail:', err.detail);  // body JSON parseado (si existe)
}
```

---

## Cliente HTTP de bajo nivel

Para casos avanzados puedes bajar al cliente crudo:

```ts
const { http } = sdk;

// GET con query string
await http.get('/api/articles', 'pagination[page]=1&pagination[pageSize]=5');

// POST / PUT aceptan un cuerpo plano (se serializa a JSON)
await http.post('/api/motos', { data: { modelName: 'X', moto125Id: 'x-1' } });

// Pasar un fetch personalizado (p. ej., con *retries* o un polyfill)
const sdk2 = createMoto125Api({
  baseUrl,
  fetchImpl: myCustomFetch,
});
```

---

## Tipos

Importa los tipos para mantener tu app fuertemente tipada:

```ts
import type {
  Article, Moto, Company, Config,
  MotoType, MotoClass, ArticleType,
  StrapiCollectionResponse, StrapiSingleResponse, StrapiQueryParams,
  ArticleCreateInput, ArticleUpdateInput,
  MotoCreateInput, MotoUpdateInput,
  CompanyCreateInput, CompanyUpdateInput,
} from '@moto125/api-client';
```

Formas de respuesta Strapi:

```ts
type Lista<T>  = StrapiCollectionResponse<T>; // { data: T[], meta: { pagination? } }
type Unico<T>  = StrapiSingleResponse<T>;     // { data: T | null, meta: {} }
```

---

