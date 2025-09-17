FROM node:20-alpine

WORKDIR /repo
ENV CI=1

RUN npm set fund false && npm config set prefer-offline true

COPY . .

RUN (npm ci --workspaces --include-workspace-root) || \
    npm install --workspaces --include-workspace-root

RUN npx lerna run build --scope @moto125/moto125-ui --include-dependencies --stream

USER node
EXPOSE 3000

CMD ["node", "apps/moto125-ui/.next/standalone/apps/moto125-ui/server.js"]
