FROM node:20-slim AS base
RUN npm install -g pnpm@10.19.0
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app

# Cache bust: v2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --no-frozen-lockfile

COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm turbo run build

FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/types/src ./packages/types/src
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json
COPY --from=builder /app/package.json ./package.json
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/backend/dist/main.js"]
