FROM node:20-slim AS base
RUN npm install -g pnpm@10.19.0
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/

RUN pnpm install --no-frozen-lockfile

COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm turbo run build

FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy everything needed for both services
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Backend files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/types/src ./packages/types/src
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json

# Frontend files
COPY --from=builder /app/apps/frontend/.next/standalone ./frontend-standalone
COPY --from=builder /app/apps/frontend/.next/static ./frontend-standalone/apps/frontend/.next/static

# Start script that picks service based on SERVICE_TYPE env var
COPY --from=builder /app/start.sh ./start.sh
RUN chmod +x ./start.sh

ENV NODE_ENV=production
EXPOSE 3000 3001
CMD ["./start.sh"]
