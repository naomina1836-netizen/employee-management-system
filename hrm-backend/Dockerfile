# HRM Backend — Node.js / Express
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Application source
COPY . .

# Ensure schema is available where bootstrap expects it
# (bootstrap reads ../database/schema.sql relative to config/)
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

# Wait for MySQL is handled by docker-compose healthcheck + depends_on
CMD ["node", "server.js"]