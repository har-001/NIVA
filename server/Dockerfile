# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++

# Copy package manifests and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including dev
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy package manifests and prisma
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies and generate client
RUN npm ci --only=production && npx prisma generate

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist

# Create uploads and backup directories
RUN mkdir -p uploads backups

# Expose backend port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
