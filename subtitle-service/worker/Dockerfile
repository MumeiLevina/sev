FROM python:3.11-slim

WORKDIR /app

# Install ffmpeg and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker application source
COPY . .

# Run Celery worker
CMD ["celery", "-A", "tasks", "worker", "--loglevel=info", "--concurrency=2"]
