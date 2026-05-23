"""
Main entry point for the ML Service.
Creates the FastAPI app, registers middleware and routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes.predictionRoutes import router as prediction_router
from app.utils.logger import logger

load_dotenv()

app = FastAPI(
    title="AI DevOps ML Service",
    description="Anomaly detection, failure prediction, and log classification for the DevOps Monitoring Platform",
    version="1.0.0"
)

# CORS — allow the Node.js backend and React frontend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all prediction endpoints under /predict
app.include_router(prediction_router, prefix="/predict", tags=["Predictions"])


@app.get("/")
def health_check():
    """Lightweight health check for load balancers and Docker HEALTHCHECK."""
    logger.info("Health check called")
    return {"status": "healthy", "service": "AI DevOps ML Service", "version": "1.0.0"}


@app.get("/health")
def detailed_health():
    """Detailed health check that lists available endpoints."""
    return {
        "status": "healthy",
        "models_loaded": True,
        "endpoints": ["/predict/anomaly", "/predict/failure", "/predict/log-classify", "/predict/full"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)