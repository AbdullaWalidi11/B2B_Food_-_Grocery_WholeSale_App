# ==========================================
# STAGE 1: Build
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install native build tools for bcrypt
RUN apk add --no-cache python3 make g++

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests AND pnpm-workspace.yaml for build approvals
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY prisma ./prisma/
COPY prisma*.config.ts ./

# Install dependencies (allowBuilds is now loaded properly)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client and compile NestJS
RUN pnpm prisma generate
RUN pnpm build

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests AND pnpm-workspace.yaml for production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/src/main.js"]