# ─────────────────────────────────────────
#  NexusOps – ML Service (FastAPI / Uvicorn)
# ─────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Runtime stage ─────────────────────────
FROM python:3.11-slim AS runtime

# Security: run as non-root
RUN addgroup --system ml && adduser --system --ingroup ml ml

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy source & pre-train the model at build time
COPY . .
RUN python train/train_model.py

USER ml

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]