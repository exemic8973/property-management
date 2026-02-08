FROM node:20-slim AS base
RUN npm install -g pnpm@10.19.0
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm turbo run build --filter=@property-os/backend

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
