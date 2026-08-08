# Stage 1: Build static assets
FROM node:20.11.1-alpine AS build
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=1536

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files and build
COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:1.25.4-alpine
WORKDIR /usr/share/nginx/html

# Install wget and curl for healthcheck probe
RUN apk add --no-cache wget curl

# Remove default nginx static assets
RUN rm -rf ./*

# Copy compiled static assets from build stage
COPY --from=build /app/dist .

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
