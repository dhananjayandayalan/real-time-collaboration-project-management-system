FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/project-service/package.json ./apps/project-service/

RUN npm ci

COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared

COPY apps/project-service/ ./apps/project-service/

WORKDIR /app/apps/project-service
RUN npx prisma generate

WORKDIR /app
RUN npm run build --workspace=apps/project-service

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/project-service/package.json ./apps/project-service/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/project-service/dist ./apps/project-service/dist
COPY --from=builder /app/apps/project-service/prisma ./apps/project-service/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

WORKDIR /app/apps/project-service
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

CMD ["node", "dist/index.js"]
