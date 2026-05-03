FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/client/package.json ./apps/client/

RUN npm ci

COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared

COPY apps/client/ ./apps/client/

ARG VITE_AUTH_API_URL=/api
ARG VITE_PROJECT_API_URL=/api
ARG VITE_TASK_API_URL=/api
ARG VITE_REALTIME_URL

ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_PROJECT_API_URL=$VITE_PROJECT_API_URL
ENV VITE_TASK_API_URL=$VITE_TASK_API_URL
ENV VITE_REALTIME_URL=$VITE_REALTIME_URL

RUN npm run build --workspace=apps/client

FROM nginx:alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
