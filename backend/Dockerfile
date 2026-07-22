FROM python:3.9-slim

ENV PYTHONUNBUFFERED=1 \
    STORAGE_ROOT=/app/storage \
    MODEL_NAME=/app/storage/models/yolo26n.pt \
    YOLO_CONFIG_DIR=/tmp/Ultralytics \
    PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN mkdir -p /app/storage/uploads \
    /app/storage/outputs \
    /app/storage/videos \
    /app/storage/logs \
    /app/storage/models \
    /tmp/Ultralytics

EXPOSE 8000

CMD ["sh", "-c", "mkdir -p /app/storage/uploads /app/storage/outputs /app/storage/videos /app/storage/logs /app/storage/models /tmp/Ultralytics && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
