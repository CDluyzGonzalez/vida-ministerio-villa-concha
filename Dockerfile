# ============================================================
# Dockerfile para Google Cloud Run
# Multi-stage build ultra ligero para Node.js
# ============================================================

# Etapa 1: Dependencias
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Etapa 2: Imagen final de producción
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copiar dependencias
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copiar código fuente
COPY server ./server
COPY database ./database
COPY scripts ./scripts
COPY js ./js
COPY css ./css
COPY icons ./icons
COPY screenshots ./screenshots
COPY index.html ./
COPY manifest.json ./
COPY apple-touch-icon.png ./

# Usuario no privilegiado por seguridad
USER node

EXPOSE 8080

CMD ["node", "server/server.js"]
