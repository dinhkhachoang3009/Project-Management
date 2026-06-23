# Backend Dockerfile — Optimized
# Mục tiêu: Giảm image size bằng Alpine Linux + loại bỏ build dependencies

FROM node:20-alpine

WORKDIR /app

# Cài build dependencies tạm thờI để compile native modules (bcrypt)
# Sau đó xóa ngay để giảm layer
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && apk add --no-cache libc6-compat

# Copy package files trước để tận dụng Docker layer cache
COPY package*.json ./

# Cài production dependencies, sau đó xóa build dependencies
RUN npm install --omit=dev \
    && apk del .build-deps

# Copy toàn bộ source (đã được .dockerignore lọc)
COPY . .

# Expose port
EXPOSE 5000

# Lệnh chạy app
CMD ["npm", "start"]
