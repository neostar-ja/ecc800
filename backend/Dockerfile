# Backend Dockerfile สำหรับ ECC800
FROM python:3.11-slim

# ตั้งค่า working directory
WORKDIR /app

# ติดตั้ง system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements และ install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Copy startup script with execute permissions
COPY --chmod=755 startup.sh /app/startup.sh

# สร้าง user ที่ไม่ใช่ root
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8010/ecc800/api/health || exit 1

# Command to run the application with startup script
CMD ["/app/startup.sh"]
