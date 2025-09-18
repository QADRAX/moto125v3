# Moto125.cc (v3)

[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-orange.svg)](LICENSE)


Este repositorio contiene el código fuente del proyecto moto125.cc, una revista en español dedicada a motocicletas de 125cc.
El código se organiza en un monorepo con Lerna, que incluye tanto el backend (Strapi) como el frontend (UI), además de varios paquetes internos que soportan procesos de migración, sincronización y servicios auxiliares.

⚠️ Importante: este repositorio incluye únicamente la arquitectura técnica del proyecto.
Es decir, contiene el código de la web y de los diferentes procesos internos de moto125.cc, pero no incluye el contenido editorial (artículos, imágenes y base de datos real).

En otras palabras, aquí se encuentra el esqueleto o plano de funcionamiento de la plataforma: cómo está estructurada, cómo se despliega, qué servicios la forman y cómo se comunican entre sí. El contenido en sí (lo que se publica en la web) se gestiona de manera privada y no está disponible en este repositorio.

## Estructura del monorepo

Este proyecto se organiza como un **monorepo**: un único repositorio que contiene varias aplicaciones y paquetes relacionados entre sí.

El monorepo está gestionado con **Lerna** junto con **workspaces de npm**, lo que permite:

- Definir dependencias compartidas en un solo `package.json` raíz.  
- Resolver automáticamente referencias internas entre paquetes (por ejemplo, `@moto125/api-client` puede ser consumido directamente por `@moto125/moto125-ui`).  
- Versionar y desplegar todas las piezas del sistema de forma consistente. 

```
moto125/
├── apps/
│ ├── moto125-strapi # Backend (CMS con Strapi)
│ └── moto125-ui # Frontend de la web pública
├── packages/
│ ├── admin-api-client # Cliente para endpoints administrativos de Strapi
│ ├── api-client # SDK tipado para la API pública de Strapi
│ ├── data-mirror # Implementación de la caché en memoria
│ └── migration # Scripts y utilidades de migración de datos
└── package.json # Configuración principal del monorepo (workspaces + Lerna)
```

## Función de cada módulo

### **Aplicaciones (`apps/`)**

- **`moto125-strapi`**  
  Backend de la plataforma, implementado con **Strapi CMS**. Define esquemas de contenido (artículos, motos, taxonomías, páginas estáticas) y expone la API que consumen el frontend y los servicios internos.

- **`moto125-ui`**  
  Aplicación de frontend que renderiza la web pública de **moto125.cc**, consumiendo la API de Strapi y utilizando el sistema de caché (`data-mirror`) para mejorar rendimiento.


### **Paquetes (`packages/`)**

- **`admin-api-client`**  
  Cliente especializado para **endpoints administrativos** de Strapi (gestión interna, subida de ficheros, mantenimiento).

- **`api-client`**  
  SDK genérico y tipado para consumir la **API pública de Strapi**.

- **`data-mirror`**  
  Implementación de la cache: hidrata datos desde Strapi, mantiene el estado en memoria, soporta snapshots en disco, refresco programado y suscripción a cambios.

- **`migration`**  
  Scripts y utilidades de **migración de datos** desde fuentes externas (p. ej. WordPress) hacia Strapi, incluyendo transformaciones y validaciones.


## Licencia

Este proyecto está publicado bajo la **Business Source License (BUSL 1.1)**.

El código es visible para fines educativos y de colaboración, pero **el uso comercial está restringido sin autorización expresa**.