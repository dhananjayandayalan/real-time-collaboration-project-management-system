FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/realtime-service/package.json ./apps/realtime-service/

RUN npm ci

COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared

COPY apps/realtime-service/ ./apps/realtime-service/
RUN npm run build --workspace=apps/realtime-service

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/realtime-service/package.json ./apps/realtime-service/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/realtime-service/dist ./apps/realtime-service/dist

WORKDIR /app/apps/realtime-service
EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3004/health || exit 1

CMD ["node", "dist/index.js"]
