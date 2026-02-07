# Сборка веб-приложения
FROM node:20-alpine AS webapp-builder
WORKDIR /app/webapp
COPY webapp/package.json webapp/package-lock.json ./
RUN npm ci
COPY webapp ./
RUN npm run build

# Финальный образ: UI + API
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY api.js server-webapp.js db.js ./
COPY config ./config
COPY services ./services
COPY --from=webapp-builder /app/webapp/dist ./webapp/dist

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server-webapp.js"]
