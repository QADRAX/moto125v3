# apps/moto125-strapi/Dockerfile
# ------------------------------------------------------------
# Stage 1 (deps dev): instala deps del workspace @moto125/strapi (incl. dev) para compilar el admin
# ------------------------------------------------------------
FROM node:20-alpine AS deps_dev
WORKDIR /repo

# Copiamos manifest y lock de la RAÍZ + manifest del workspace de Strapi
COPY package.json package-lock.json ./
COPY apps/moto125-strapi/package.json apps/moto125-strapi/package.json

# Instala SOLO las deps del workspace (con dev para poder hacer el build del admin)
RUN npm ci -w @moto125/strapi

# ------------------------------------------------------------
# Stage 2 (deps prod): mismas deps pero sin dev para la imagen final
# ------------------------------------------------------------
FROM node:20-alpine AS deps_prod
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/moto125-strapi/package.json apps/moto125-strapi/package.json
RUN npm ci --omit=dev -w @moto125/strapi

# ------------------------------------------------------------
# Stage 3 (build): compila el admin de Strapi
# ------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /repo

# Reutilizamos node_modules (con dev) para compilar
COPY --from=deps_dev /repo/node_modules ./node_modules
COPY --from=deps_dev /repo/apps/moto125-strapi/package.json apps/moto125-strapi/package.json

# Copiamos TODO el repo (plugins locales, config, etc.) y build
COPY . .
WORKDIR /repo/apps/moto125-strapi
RUN npm run build

# ------------------------------------------------------------
# Stage 4 (runtime): imagen final, sólo prod deps
# ------------------------------------------------------------
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Copiamos la app ya compilada y deps de producción
COPY --from=build     /repo/apps/moto125-strapi ./
COPY --from=deps_prod /repo/node_modules        ./node_modules

# Usuario no root
RUN addgroup -g 1001 strapi && adduser -D -G strapi -u 1001 strapi \
  && mkdir -p /app/public/uploads \
  && chown -R strapi:strapi /app
USER strapi

EXPOSE 1337
CMD ["npm", "run", "start"]
