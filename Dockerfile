# Multi-stage build for Next.js app with native deps (better-sqlite3, sharp)

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund

FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built app and production deps
COPY --from=build /app /app

# Ensure writable directories for volumes
RUN mkdir -p /app/data /app/public/uploads \
  && chown -R node:node /app/data /app/public/uploads

USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]


