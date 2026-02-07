# Stage 1: Build
FROM node:20-slim AS builder

# Install OpenSSL and other dependencies needed for Prisma
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy application source
COPY . .

# Generates Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build && ls -R dist

# Stage 2: Production
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built assets and dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose the API port
EXPOSE 3000

# Run migrations, seed the database, and start the application
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npx prisma db seed && node dist/main.js"]
