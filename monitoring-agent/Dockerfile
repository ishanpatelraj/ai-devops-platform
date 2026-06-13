# ─────────────────────────────────────────
#  NexusOps – Monitoring Agent
# ─────────────────────────────────────────
FROM python:3.11-slim

# Security: run as non-root user
RUN addgroup --system agent && adduser --system --ingroup agent agent

WORKDIR /app

# Install dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent source
COPY agent.py .

# Switch to non-root
USER agent

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

CMD ["python", "agent.py"]
