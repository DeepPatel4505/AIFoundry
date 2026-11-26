# Stage 1: Build Angular application using Nx
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies needed for build tools
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install npm dependencies
COPY package*.json ./
RUN npm ci

# Copy project workspace source
COPY . .

# Build Angular web project for production
RUN npx nx build web --configuration=production

# Stage 2: Serve built assets using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist/apps/web/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
