# Etapa 1: build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build admin panel
RUN npm run build

# Etapa 2: runtime
FROM node:20-alpine

# Crear usuario no root
RUN addgroup -g 1001 strapi && adduser -D -G strapi -u 1001 strapi

# Set working directory
WORKDIR /app

# Copy from build stage
COPY --chown=strapi:strapi --from=builder /app .

# Install production deps only
RUN npm ci --omit=dev

# Change ownership of the directory
USER strapi

# Expose default port
EXPOSE 1337

# Start Strapi
CMD ["npm", "run", "start"]
