FROM node:20-alpine AS deps
WORKDIR /repo
ENV CI=1
RUN npm set fund false && npm config set prefer-offline true

COPY package.json package-lock.json lerna.json* ./

COPY apps/moto125-ui/package.json apps/moto125-ui/
COPY packages/api-client/package.json packages/api-client/
COPY packages/data-mirror-core/package.json packages/data-mirror-core/
COPY packages/data-mirror/package.json packages/data-mirror/
COPY packages/data-mirror-worker/package.json packages/data-mirror-worker/

RUN (npm ci --workspaces --include-workspace-root) || \
    npm install --workspaces --include-workspace-root

FROM deps AS build
WORKDIR /repo

COPY apps/moto125-ui/ apps/moto125-ui/
COPY packages/api-client/ packages/api-client/
COPY packages/data-mirror-core/ packages/data-mirror-core/
COPY packages/data-mirror/ packages/data-mirror/
COPY packages/data-mirror-worker/ packages/data-mirror-worker/

RUN npx lerna run build --scope @moto125/moto125-ui --include-dependencies --stream

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /home/node/app

COPY --from=build /repo/apps/moto125-ui/.next/standalone ./
COPY --from=build /repo/node_modules/@moto125/data-mirror-worker ./node_modules/@moto125/data-mirror-worker

RUN install -d -m 0775 -o node -g node /home/node/app/.cache

USER node
EXPOSE 3000
CMD ["node", "apps/moto125-ui/server.js"]
