FROM node:20-bookworm AS builder
ENV CI=1 NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo

RUN npm i -g npm@11.3.0

COPY . .

RUN --mount=type=cache,target=/root/.npm \
    npm ci

RUN npx lerna run build --scope @moto125/moto125-ui --stream

########### RUNTIME ###########
FROM node:20-bookworm AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CACHE_SNAPSHOT_PATH=/app/.cache/snapshot.json

WORKDIR /repo
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages      ./packages
COPY --from=builder /repo/apps/moto125-ui ./apps/moto125-ui
COPY --from=builder /repo/package.json  ./package.json
COPY --from=builder /repo/lerna.json    ./lerna.json

RUN install -d -m 700 -o node -g node /app/.cache
VOLUME ["/app/.cache"]

WORKDIR /repo
USER node
EXPOSE 3000
CMD ["npm", "run", "start:ui"]
