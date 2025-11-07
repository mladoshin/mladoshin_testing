# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile --filter backend...

# Copy backend source code
COPY apps/backend ./apps/backend

# Build the application
WORKDIR /workspace/apps/backend
RUN pnpm run build

# Production stage
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages

# Install only production dependencies
RUN pnpm install --frozen-lockfile --filter backend... --prod

# Copy built application from builder
COPY --from=builder /workspace/apps/backend/dist ./apps/backend/dist

# Copy necessary files
COPY apps/backend/scripts ./apps/backend/scripts

WORKDIR /workspace/apps/backend

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /workspace

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1

# Start the application
CMD ["node", "dist/main"]
