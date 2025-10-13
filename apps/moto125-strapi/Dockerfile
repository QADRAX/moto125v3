# -----------------------------
# Builder: instala deps y build
# -----------------------------
FROM node:20-alpine AS builder
ENV CI=1 NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
WORKDIR /repo

RUN apk add --no-cache python3 make g++ libc6-compat

RUN npm i -g npm@11.3.0

COPY package*.json ./
COPY lerna.json ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,target=/root/.npm npm ci

RUN npx lerna run build --scope @moto125/strapi --include-dependencies --stream

RUN npm prune --omit=dev

# -----------------------------
# Runner: imagen final
# -----------------------------
FROM node:20-alpine AS runner
ENV NODE_ENV=production \
    PORT=1337 \
    HOST=0.0.0.0

RUN apk add --no-cache tini

WORKDIR /repo

COPY --from=builder /repo/node_modules           ./node_modules
COPY --from=builder /repo/packages               ./packages
COPY --from=builder /repo/apps/moto125-strapi    ./apps/moto125-strapi
COPY --from=builder /repo/package.json           ./package.json
COPY --from=builder /repo/lerna.json             ./lerna.json

USER node
EXPOSE 1337

ENTRYPOINT ["/sbin/tini","--"]
CMD ["npm", "run", "start", "-w", "@moto125/strapi"]
