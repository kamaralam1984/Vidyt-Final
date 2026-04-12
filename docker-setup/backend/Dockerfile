# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# ============================================
# STAGE 2: Builder (for TypeScript compilation if needed)
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Compile TypeScript if tsconfig exists
RUN if [ -f tsconfig.json ]; then npm run build || true; else echo "No TypeScript build needed"; fi

# ============================================
# STAGE 3: Production Runtime
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy package.json
COPY --chown=nodejs:nodejs package.json ./

# Copy compiled code from builder stage if it exists
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist 2>/dev/null || true
COPY --from=builder --chown=nodejs:nodejs /app/src ./src 2>/dev/null || true

# Copy public assets if they exist
COPY --chown=nodejs:nodejs public ./public 2>/dev/null || true

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Environment variables (can be overridden)
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
