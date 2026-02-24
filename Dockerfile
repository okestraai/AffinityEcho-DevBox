# ============================================================
# Stage 1: Build the React SPA with Vite
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache optimization)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Accept build-time arguments for Vite environment variables
# These get baked into the JS bundle during 'vite build'
ARG VITE_API_BASE_URL=https://api.affinityecho.com
ARG VITE_API_URL=https://api.affinityecho.com/api/v1
ARG VITE_WS_URL=https://api.affinityecho.com
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ============================================================
# Stage 2: Serve with nginx
# ============================================================
FROM nginx:1.27-alpine AS production

# Remove default nginx site
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user and fix permissions
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
