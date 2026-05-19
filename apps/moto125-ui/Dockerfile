FROM node:22-alpine AS builder
ENV CI=1 NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo

RUN apk add --no-cache python3 make g++ libc6-compat

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm turbo run build --filter=@moto125/moto125-ui...

FROM node:22-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CACHE_SNAPSHOT_PATH=/app/.cache/snapshot.json

RUN apk add --no-cache tini

RUN corepack enable

WORKDIR /repo

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/moto125-ui ./apps/moto125-ui
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN install -d -m 700 -o node -g node /app/.cache
VOLUME ["/app/.cache"]

USER node
EXPOSE 3000
ENTRYPOINT ["/sbin/tini","--"]
CMD ["pnpm", "run", "start:ui"]
