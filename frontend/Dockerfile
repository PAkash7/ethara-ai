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

# Set default PORT for local development, Railway overrides this
ENV PORT=80

# Copy our Nginx template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy built React files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
