# ============================================
# PayProof Backend — Cloud Run / Production
# ============================================
FROM python:3.11-slim

# System dependencies for OpenCV and EasyOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# PORT is set by Cloud Run (default 8080)
ENV PORT=8080
EXPOSE ${PORT}

# Start the app
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
