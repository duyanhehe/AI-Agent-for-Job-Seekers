FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements FIRST to leverage Docker cache
COPY requirements.txt .

# Upgrade pip and install pip-tools
RUN pip install --no-cache-dir --upgrade pip pip-tools

# Pre-install torch CPU (prevents pip-sync from trying to pull the huge CUDA version)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Sync remaining dependencies
RUN pip-sync --pip-args "--no-cache-dir --default-timeout=1000 --extra-index-url https://download.pytorch.org/whl/cpu"

# Copy only application code (avoiding front-end/etc via .dockerignore)
COPY . .

# Default port
ENV PORT=8000

# Expose port
EXPOSE $PORT

# Health check using the internal port
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Run the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
