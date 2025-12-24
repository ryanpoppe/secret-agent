# Stage 1: Build the Vue application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set base URL for production (override GitHub Pages path)
ENV VITE_BASE_URL=/

# Build argument for API endpoint
ARG VITE_API_ENDPOINT=/api/leads
ENV VITE_API_ENDPOINT=${VITE_API_ENDPOINT}

# Build the application (override base in vite config)
RUN npm run build-only -- --base=/

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

