# syntax=docker/dockerfile:1
# Multi-stage build pour bot Discord TypeScript

# ---- Stage build ----
FROM node:26-alpine AS builder

WORKDIR /app

# Dépendances (avec devDependencies pour compiler TypeScript)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Code source + build
COPY src/ ./src/
RUN npm run build

# On ne garde que les dépendances de production pour le stage final
RUN npm prune --omit=dev

# ---- Stage production ----
FROM node:26-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Artefacts depuis le builder (pas de code source, pas de tsconfig, pas de .env)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Migrations SQL : appliquées au démarrage par src/fonctions/database/migrations.ts
COPY migrations/ ./migrations/

# Utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001 -G nodejs && \
    chown -R botuser:nodejs /app
USER botuser

# Pas de HEALTHCHECK : le bot n'expose aucun port HTTP, un check serait factice.
# La liveness est gérée par `restart: always` côté docker-compose.

# Enregistre les commandes slash auprès de Discord, puis lance le bot.
CMD ["sh", "-c", "node dist/deploy-commands.js && node dist/app.js"]
