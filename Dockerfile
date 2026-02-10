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

# Set API URL to empty so frontend calls /api on the same domain via nginx
ENV NEXT_PUBLIC_API_URL=""
RUN pnpm turbo run build

# Remove dev dependencies to shrink node_modules significantly
RUN CI=true pnpm prune --prod --no-optional

FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl nginx curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser
WORKDIR /app

# Copy production node_modules (dev deps already pruned)
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

# Redirect nginx logs to stdout/stderr so Zeabur can capture them
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

# Nginx config: route /api to backend, everything else to frontend
RUN printf 'server {\n\
    listen 8080;\n\
    client_max_body_size 10m;\n\
\n\
    # Security headers\n\
    add_header X-Frame-Options "SAMEORIGIN" always;\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    add_header X-XSS-Protection "1; mode=block" always;\n\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n\
\n\
    location /api {\n\
        proxy_pass http://127.0.0.1:3001;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_connect_timeout 30s;\n\
        proxy_read_timeout 60s;\n\
    }\n\
    location / {\n\
        proxy_pass http://127.0.0.1:3000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
}\n' > /etc/nginx/sites-available/default

# Start script: migrate DB, wait for services, then start nginx
RUN printf '#!/bin/sh\n\
echo "[startup] PropertyOS container starting..."\n\
echo "[startup] Running database migrations..."\n\
./node_modules/.bin/prisma db push --schema=/app/packages/database/prisma/schema.prisma --skip-generate --accept-data-loss 2>&1 || echo "[startup] WARNING: prisma db push failed, continuing..."\n\
echo "[startup] Starting backend on port 3001..."\n\
node /app/apps/backend/dist/main.js 2>&1 &\n\
BACKEND_PID=$!\n\
echo "[startup] Backend PID: $BACKEND_PID"\n\
echo "[startup] Starting frontend on port 3000..."\n\
cd /app/frontend-standalone && HOSTNAME=0.0.0.0 PORT=3000 node apps/frontend/server.js 2>&1 &\n\
FRONTEND_PID=$!\n\
echo "[startup] Frontend PID: $FRONTEND_PID"\n\
echo "[startup] Waiting for services to be ready..."\n\
for i in 1 2 3 4 5 6 7 8 9 10; do\n\
  if curl -sf http://127.0.0.1:3001/api/health > /dev/null 2>&1; then\n\
    echo "[startup] Backend is ready"\n\
    break\n\
  fi\n\
  echo "[startup] Waiting for backend... ($i/10)"\n\
  sleep 2\n\
done\n\
echo "[startup] Starting nginx on port 8080..."\n\
nginx -g "daemon off;" 2>&1\n' > /app/start.sh && chmod +x /app/start.sh

# Allow nginx to write pid and logs
RUN chown -R appuser:appuser /app && \
    chown -R appuser:appuser /var/log/nginx && \
    chown -R appuser:appuser /var/lib/nginx && \
    touch /run/nginx.pid && chown appuser:appuser /run/nginx.pid

USER appuser

ENV NODE_ENV=production
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -sf http://127.0.0.1:8080/api/health || exit 1
CMD ["/app/start.sh"]
