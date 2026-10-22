# Backend Dockerfile — Optimized
# Mục tiêu: Giảm image size bằng Alpine Linux + loại bỏ build dependencies

FROM node:20-alpine

WORKDIR /app

# Copy package files trước để tận dụng Docker layer cache
COPY package*.json ./

# Gộp trong 1 RUN: cài build deps → install → xóa build deps (không lưu layer thừa)
RUN apk add --no-cache libc6-compat \
    && apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install --omit=dev \
    && apk del .build-deps

# Copy toàn bộ source (đã được .dockerignore lọc) — quyền node để container chạy non-root
RUN chown -R node:node /app
COPY --chown=node:node . .

# Non-root user (G3)
USER node

# Expose port
EXPOSE 5000

# Container chạy node trực tiếp (không phải npm → đúng PID 1 / signal handling)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:5000/ || exit 1

# Lệnh chạy app
CMD ["node", "index.js"]
