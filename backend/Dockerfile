# Backend Dockerfile
# Dùng node:20-slim để có đủ dependencies cho bcrypt và các native module

FROM node:20-slim

WORKDIR /app

# Copy package files trước để tận dụng Docker layer cache
COPY package*.json ./

# Cài dependencies
RUN npm install --omit=dev

# Copy toàn bộ source
COPY . .

# Expose port
EXPOSE 5000

# Lệnh chạy app
CMD ["npm", "start"]
