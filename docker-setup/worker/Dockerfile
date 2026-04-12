# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci --only=production && npm cache clean --force

# ============================================
# STAGE 2: Production Runtime
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling and curl
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy package.json
COPY --chown=nodejs:nodejs package.json ./

# Copy worker code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port for metrics (if needed)
EXPOSE 5002

# Environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5002/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start worker process
CMD ["node", "worker.js"]
