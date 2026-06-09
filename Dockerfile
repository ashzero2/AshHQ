FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ── deps ──────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts
RUN npx prisma generate

# ── builder ───────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
# Bundle seed.ts to plain JS so the runner stage doesn't need tsx/typescript
RUN node_modules/.bin/esbuild prisma/seed.ts \
    --bundle --platform=node --target=node20 \
    --outfile=prisma/seed.js \
    --external:@prisma/client \
    --log-level=warning

# ── runner ────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# prisma CLI needed for db push at startup
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

RUN mkdir -p /data && chown -R nextjs:nodejs /data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# On every start: sync DB schema.
# On FIRST start only (.seeded flag in persistent volume): seed default data.
CMD ["sh", "-c", "\
  node node_modules/prisma/build/index.js db push --skip-generate && \
  ([ -f /data/.seeded ] || (node prisma/seed.js && touch /data/.seeded)) && \
  node server.js"]
