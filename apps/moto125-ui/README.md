# @moto125/moto125-ui

Aplicación **Next.js 14** que sirve como **UI principal** de [moto125.cc](https://www.moto125.cc). 
 
Está optimizada para SEO, genera sitemaps dinámicos, feeds RSS/JSON y se integra con el sistema de **content-cache** para un arranque rápido y rehidratación de datos desde Strapi.  

---

## Características principales

- **Next.js 14** con `app/` router  
- **Tailwind CSS 4** + tipografía optimizada  
- **Integración con Content Cache** (vía `@moto125/content-cache` y `@moto125/content-cache-worker`)  
- **Sitemaps**: generación de sitemaps globales y por tema (`/sitemap.xml`, `/sitemap/[id]`)  
- **Feeds RSS y JSON** (`/feed.xml`, `/feed.json`)  
- **Integración con Google Analytics (GA)**  
- **Gestión de consentimiento de cookies de terceros**  
- **Generación dinámica de metadata para SEO**  
- **Docker-ready** para despliegue en producción  

---

## Rutas principales

| Ruta                         | Descripción |
|------------------------------|-------------|
| `/`                          | Página principal |
| `/articulos`                 | Listado de artículos |
| `/articulos/p/[page]`        | Paginación de artículos |
| `/articulos/tipo/[tipo]`     | Listado por tipo de artículo |
| `/articulos/tipo/[tipo]/p/[page]` | Paginación por tipo de artículo |
| `/articulos/[slug]`          | Artículo individual |
| `/motos`                     | Catálogo de motos |
| `/motos/[class]`             | Vista por clase de moto |
| `/motos/[class]/[type]`      | Vista por tipo dentro de clase |
| `/moto/[moto]`               | Ficha individual de moto |
| `/marcas`                    | Listado de marcas |
| `/marcas/[brand]`            | Ficha de marca |
| `/sobre-nosotros`            | Página institucional |
| `/aviso-legal`               | Página legal |
| `/politica-de-cookies`       | Página de cookies |
| `/politica-de-privacidad`    | Página de privacidad |
| `/buscar`                    | Buscador |
| `/sitemap`                   | Sitemap global |
| `/sitemap/[id]`              | Sitemaps por tema |
| `/robots.txt`                | Robots.txt dinámico |
| `/feed.xml` / `/feed.json`   | Feed RSS y JSON |

---

## Integración con Content Cache

La UI consume datos desde Strapi a través de la capa de **Content Cache**, lo que permite:  
- **Arranque rápido** en SSR gracias a snapshots persistidos en disco  
- **Rehidratación en segundo plano** sin bloquear la renderización  
- **Consistencia** entre múltiples instancias del servidor  

---

## Estilos

- **Tailwind CSS 4** con tipografía optimizada (`@tailwindcss/typography`)  
- **Animaciones** con `tailwindcss-animate`  
- Estilos globales en `globals.css`  

---

## SEO y Analytics

- **Metadata dinámica** generada en `layout.tsx` y en páginas individuales  
- **Google Analytics (GA)** integrado para tracking de visitas  
- **Gestión de consentimiento de cookies** para cumplir normativa europea  

---

## Scripts

- `npm run dev` → Levanta la UI en modo desarrollo en `http://localhost:1338`  
- `npm run build` → Compila la aplicación y prepara la versión standalone  
- `npm start` → Inicia la UI en producción en el puerto `3000`  
- `npm run typecheck` → Verificación de tipos con TypeScript  

---

## Despliegue con Docker

El proyecto incluye configuración para **Docker**, permitiendo empaquetar la UI junto con sus dependencias y ejecutar en producción sin necesidad de Node.js instalado localmente.  

Ejemplo de build y run:

```bash
docker build -t moto125-ui .
docker run -p 3000:3000 moto125-ui
```
