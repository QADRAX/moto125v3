# @moto125/strapi

Aplicación **Strapi v5** que define el **modelo de contenido** de *moto125.cc*.  

Incluye colecciones para artículos, motos y marcas, además de `singleTypes` para páginas estáticas y configuración global.

---

## Diseño de contenido

A continuación se resume el modelo principal.

Se distinguen **colecciones dinámicas** (collection types) y **páginas estáticas** (single types).

### Collection Types (dinámicos)

| UID | Nombre (ES) | Campos clave | Relaciones | Notas |
| --- | --- | --- | --- | --- |
| `api::article.article` | **Artículos** | `slug (uid, req)`, `title`, `publicationDate`, `visible`, `coverImage (media, req)`, `content (dynamiczone)`, `tags (component repeatable)`, `authorText`, `authorPhotos`, `authorAction`, `youtubeLink` | `articleType (manyToOne)`, `relatedMotos (manyToMany)`, `relatedCompanies (manyToMany)` | Rico en contenidos: texto, grids, prestaciones, fortalezas/debilidades. |
| `api::company.company` | **Marcas** | `name`, `image (media)`, `phone`, `url`, `active`, `description (richtext)` | `motos (oneToMany)`, `articles (manyToMany)` | Soporta logo/imagen y descripción larga. |
| `api::moto.moto` | **Motos** | `moto125Id (uid, req)`, `modelName (req)`, `fullName`, `description`, `images (media[])`, `priece (decimal)`, `year (int)`, `fichaTecnica (json)`, `active`, `normativa (enum)`, `engineType (enum)` | `company (manyToOne)`, `motoType (manyToOne)`, `articles (manyToMany)` | Campos de ficha técnica y galería. *(Nota: `priece` parece typo de `price`.)* |
| `api::article-type.article-type` | **Tipos de artículo** | `name` | `articles (oneToMany)` | Catálogo para clasificar artículos. |
| `api::moto-type.moto-type` | **Tipos de moto** | `name`, `image (media)`, `fullName`, `description (richtext)` | `motos (oneToMany)`, `motoClass (manyToOne)` | Taxonomía intermedia. |
| `api::moto-class.moto-class` | **Clases de moto** | `name (req)`, `image (media)` | `motoTypes (oneToMany)` | Taxonomía superior. |

### Single Types (estáticos)

| UID | Nombre (ES) | Campos clave | Notas |
| --- | --- | --- | --- |
| `api::config.config` | **Configuración del sitio** | `siteName`, `logo`, `favicon`, `metaTitleDefault`, `metaDescriptionDefault`, `metaImageDefault`, `twitterHandle`, `openGraphTitle`, `openGraphDescription`, `openGraphImage`, `canonicalUrl`, `googleAnalyticsId`, `heroBannerImage`, `heroBannerTitle`, `heroBannerSubtitle` | Metadatos globales, SEO y recursos gráficos. |
| `api::home-page.home-page` | **Página principal** | `featuredArticles (component)`, `top10speed (component)` | Agregadores de contenido (destacados y top por velocidad). |
| `api::pagina-ofertas.pagina-ofertas` | **Página de ofertas** | `title`, `content (richtext)`, `ofertas (dynamiczone)` | Bloques de ofertas como componentes dinámicos. |
| `api::about-us-page.about-us-page` | **Página quiénes somos** | `content (richtext)` | Página corporativa. |

---

## Componentes

### Zona dinámica de **Artículo**

| Componente | UID | Campos |
| --- | --- | --- |
| **TextContent** | `article-content.text-content` | `Text (richtext)` |
| **ImageGridContent** | `article-content.image-grid-content` | *(sin campos definidos de momento)* |
| **Prestaciones** | `article-content.prestaciones` | `prestaciones (json)` |
| **FortalezasDebilidades** | `article-content.fortalezas-debilidades` | `Fortalezas (component list.foralezas-list, repeatable)`, `Debilidades (component list.debilidades-list, repeatable)` |

### Componentes de **listas** y agregación

| Componente | UID | Campos | Uso |
| --- | --- | --- | --- |
| **ArticulosDestacados** | `list.articulos-destacados` | `featuredArticle1..3 (oneToOne article)` | Home: destacados manuales. |
| **Top10MotosSpeed** | `list.top10-motos-speed` | `top1..top10 (oneToOne moto)`, `top1speed..top10speed (string)` | Home: ranking con velocidades. |
| **Oferta** | `list.ofertas` | `title (string)`, `content (richtext)` | Página de ofertas (dynamiczone). |
| **TagList** | `list.tag-list` | `Value (string, req)` | Etiquetas libres para artículos. |
| **ForalezasList** | `list.foralezas-list` | `value (string)` | Item de fortaleza. *(typo “Foralezas” en UID de archivo)* |
| **DebilidadesList** | `list.debilidades-list` | `value (string)` | Item de debilidad. |


---
