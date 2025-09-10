# ------------------------------------------------------------
# Stage 1 (deps dev): install deps (incl. dev) to build Strapi admin
# ------------------------------------------------------------
FROM node:20-alpine AS deps_dev
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/moto125-strapi/package.json apps/moto125-strapi/package.json

RUN npm ci -w @moto125/strapi

# ------------------------------------------------------------
# Stage 2 (deps prod): same deps but only prod for final image
# ------------------------------------------------------------
FROM node:20-alpine AS deps_prod
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/moto125-strapi/package.json apps/moto125-strapi/package.json

RUN npm ci --omit=dev -w @moto125/strapi

# ------------------------------------------------------------
# Stage 3 (build): build Strapi admin
# ------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /repo

COPY --from=deps_dev /repo/node_modules ./node_modules
COPY --from=deps_dev /repo/apps/moto125-strapi/package.json apps/moto125-strapi/package.json

COPY . .
WORKDIR /repo/apps/moto125-strapi
RUN npm run build

# ------------------------------------------------------------
# Stage 4 (runtime): final image with prod deps
# ------------------------------------------------------------
FROM node:20-alpine
ENV NODE_ENV=production

# Use the pre-existing `node` user (uid=1000, gid=1000)
WORKDIR /home/node/app

# Ensure uploads dir exists with correct ownership
RUN install -d -o node -g node /home/node/app/public/uploads

# Copy app build + prod deps with correct ownership
COPY --from=build     --chown=node:node /repo/apps/moto125-strapi ./ 
COPY --from=deps_prod --chown=node:node /repo/node_modules        ./node_modules

USER node

EXPOSE 1337
CMD ["npm", "run", "start"]
