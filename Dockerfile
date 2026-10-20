FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=1536
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build NEXT_PUBLIC_APP_URL=https://movepilotai.com
RUN npm run build
FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/scripts/seed-admin.mjs ./scripts/seed-admin.mjs
RUN mkdir -p uploads/documents uploads/inventory && chown -R node:node uploads
USER node
EXPOSE 3000
CMD ["node","server.js"]
