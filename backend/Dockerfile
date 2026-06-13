# ─────────────────────────────────────────
#  NexusOps – Backend (Node / Express)
# ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Runtime stage ─────────────────────────
FROM node:20-alpine AS runtime

# Security: run as non-root
RUN addgroup -S nexus && adduser -S nexus -G nexus

WORKDIR /app

# Copy only production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package.json ./

USER nexus

ENV NODE_ENV=production

EXPOSE 5000
CMD ["node", "src/server.js"]
