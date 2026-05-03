FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/task-service/package.json ./apps/task-service/

RUN npm ci

COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared

COPY apps/task-service/ ./apps/task-service/

WORKDIR /app/apps/task-service
RUN npx prisma generate

WORKDIR /app
RUN npm run build --workspace=apps/task-service

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/task-service/package.json ./apps/task-service/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/task-service/dist ./apps/task-service/dist
COPY --from=builder /app/apps/task-service/prisma ./apps/task-service/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

RUN mkdir -p /app/apps/task-service/uploads

WORKDIR /app/apps/task-service
EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["node", "dist/index.js"]
