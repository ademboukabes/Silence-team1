# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
# Install ALL dependencies for build
RUN npm ci --legacy-peer-deps

# Stage 2: Build
FROM node:20-slim AS builder
# Install OpenSSL for Prisma generate
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Compile seed script
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --module commonjs --target es2017 --skipLibCheck
# Build the application
RUN npm run build

# Stage 4: Runner
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Install production dependencies directly in the runner stage to ensure correct linking
RUN npm ci --only=production --legacy-peer-deps && npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss --schema=prisma/schema.prisma && npx prisma db seed && node dist/main.js"]
