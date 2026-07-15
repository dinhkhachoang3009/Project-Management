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

# Copy toàn bộ source (đã được .dockerignore lọc)
COPY . .

# Expose port
EXPOSE 5000

# Lệnh chạy app
CMD ["npm", "start"]
