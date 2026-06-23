# Frontend Dockerfile — Optimized Multi-Stage
# Mục tiêu: Stage 2 chỉ chứa build output + production node_modules

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Truyền API URL từ Railway/CI vào build stage
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Loại bỏ devDependencies để stage 2 nhẹ hơn
RUN npm prune --production --legacy-peer-deps

# Stage 2: Production (chỉ chứa những gì cần để chạy)
FROM node:20-alpine

WORKDIR /app

# Copy build output và production dependencies từ builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
