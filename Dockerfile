# ==============================================================================
# LastKey v0.2 — Hardened Multi-Stage Production Dockerfile (sec-0.2)
# Mitigasi: R02 (Isolation), R05 (No Secrets in Image), Container Security
# ==============================================================================

# Stage 1: Dependencies & Build
FROM node:20-alpine AS builder
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
COPY . .

# Build Next.js Standalone Output jika belum tersedia pada build context,
# dan pastikan tidak ada file .env yang ikut terbawa ke artefak standalone (R05)
ENV NEXT_TELEMETRY_DISABLED=1
RUN if [ ! -f .next/standalone/server.js ]; then \
      npm ci && npx prisma generate && npm run build; \
    fi && \
    rm -f /app/.env* /app/.next/standalone/.env*

# Stage 2: Minimal Hardened Production Runner
FROM node:20-alpine AS runner

# Patch seluruh paket OS Alpine dan hapus package manager/npm/yarn dari runtime image
# untuk mengeliminasi permukaan serangan dan kerentanan paket npm/tar/minimatch di produksi
RUN apk update && apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn* \
           /var/cache/apk/* \
           /root/.npm \
           /tmp/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Buat group dan user non-root khusus aplikasi (UID/GID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Salin hanya artefak runtime minimal dengan kepemilikan non-root
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Jalankan container sebagai non-root user
USER 1001:1001

EXPOSE 3000

CMD ["node", "server.js"]
