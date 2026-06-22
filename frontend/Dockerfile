# Frontend Dockerfile
# Multi-stage build để giảm image size

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Copy build output và package.json
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Chỉ cài production dependencies
RUN npm prune --production --legacy-peer-deps

EXPOSE 3000

CMD ["npm", "start"]
