FROM node:20-slim AS base
RUN npm install -g pnpm@10.19.0
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm turbo run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json
COPY --from=builder /app/package.json ./package.json
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/backend/dist/main.js"]
