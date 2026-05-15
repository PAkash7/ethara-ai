# ─────────────────────────────────────────────────────────────
# Frontend Dockerfile — Two-stage: Node build → Nginx serve
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Build the React app ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (use ci for reproducible builds)
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Copy source
COPY . .

# When running behind Nginx proxy, VITE_API_URL is empty so all
# /api/ requests are relative and Nginx routes them to the backend.
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────
FROM nginx:1.25-alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
