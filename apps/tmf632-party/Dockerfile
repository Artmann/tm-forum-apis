# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/tmf-common/package.json ./packages/tmf-common/
COPY apps/tmf632-party/package.json ./apps/tmf632-party/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY packages/tmf-common ./packages/tmf-common
COPY apps/tmf632-party ./apps/tmf632-party

# Build the application
RUN bun run build --filter=tmf632-party

# Production stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 tmforum

# Copy built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/tmf632-party ./apps/tmf632-party

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER tmforum

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run the application
CMD ["bun", "run", "apps/tmf632-party/src/index.ts"]
