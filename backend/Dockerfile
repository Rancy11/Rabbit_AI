# ── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production image ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production

CMD ["node", "src/index.js"]