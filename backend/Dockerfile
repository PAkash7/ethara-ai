# ─────────────────────────────────────────────────────────────
# Backend Dockerfile — Django + Gunicorn
# ─────────────────────────────────────────────────────────────
FROM python:3.11-slim

# Install system deps (pg client for health checks, curl for debugging)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Collect static files (uses a dummy SECRET_KEY for this build step only)
RUN SECRET_KEY=build-phase-only-dummy-key \
    DATABASE_URL=sqlite:///tmp/build.sqlite3 \
    python manage.py collectstatic --noinput

EXPOSE 8000

# Entrypoint: run migrations then start Gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && \
     gunicorn core.wsgi:application \
       --bind 0.0.0.0:8000 \
       --workers 2 \
       --timeout 60 \
       --access-logfile - \
       --error-logfile -"]
