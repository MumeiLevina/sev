FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install all mission-critical CLI engines & International Fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    qpdf \
    libmagic1 \
    calibre \
    fonts-liberation \
    fonts-dejavu \
    fonts-noto-cjk \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libffi-dev \
    curl \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run Celery Worker with 2 concurrency per container and bounded queues
CMD ["celery", "-A", "worker.celery_app", "worker", "--loglevel=info", "-Q", "fast,heavy", "-c", "2", "-E"]
