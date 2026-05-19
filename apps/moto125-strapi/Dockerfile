# -----------------------------
# Builder: instala deps y build
# -----------------------------
FROM node:22-alpine AS builder
ENV CI=1 NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
WORKDIR /repo

RUN apk add --no-cache python3 make g++ libc6-compat

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm turbo run build --filter=@moto125/strapi...

# -----------------------------
# Runner: imagen final
# -----------------------------
FROM node:22-alpine AS runner
ENV NODE_ENV=production \
    PORT=1337 \
    HOST=0.0.0.0

RUN apk add --no-cache tini

RUN corepack enable

WORKDIR /repo

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/moto125-strapi ./apps/moto125-strapi
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml

USER node
EXPOSE 1337

ENTRYPOINT ["/sbin/tini","--"]
CMD ["pnpm", "--filter", "@moto125/strapi", "start"]
