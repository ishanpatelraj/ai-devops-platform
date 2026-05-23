"""
Prediction Routes.

All endpoints the Node.js backend calls:

  POST /predict/anomaly       → Isolation Forest anomaly check
  POST /predict/failure       → Random Forest failure probability
  POST /predict/log-classify  → Naive Bayes log category
  POST /predict/full          → Both metric analyses + health score
"""

from fastapi        import APIRouter, HTTPException
from pydantic       import BaseModel, Field
from typing         import Optional
from app.services.predictionService import prediction_service
from app.utils.logger import logger

router = APIRouter()


# ── Pydantic Schemas ─────────────────────────────────────────────────────────
# FastAPI uses these for automatic request validation AND OpenAPI docs generation.

class MetricInput(BaseModel):
    cpuUsage:    float           = Field(...,   ge=0, le=100, description="CPU usage %")
    memoryUsage: float           = Field(...,   ge=0, le=100, description="Memory usage %")
    diskUsage:   float           = Field(...,   ge=0, le=100, description="Disk usage %")
    networkIn:   Optional[float] = Field(default=0,  ge=0,   description="Network bytes in")
    networkOut:  Optional[float] = Field(default=0,  ge=0,   description="Network bytes out")
    serverId:    Optional[str]   = Field(default=None,        description="Server identifier")

class LogInput(BaseModel):
    message: str           = Field(..., min_length=1, description="Raw log message")
    service: Optional[str] = Field(default=None,      description="Originating service name")


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/anomaly")
async def detect_anomaly(data: MetricInput):
    """
    Detect anomalies in server metrics.

    Example request body:
```json
    {"cpuUsage": 95, "memoryUsage": 88, "diskUsage": 45, "networkIn": 5000, "networkOut": 3000}
```

    Example response:
```json
    {"isAnomaly": true, "confidence": 0.87, "details": "Anomaly detected - High CPU: 95.0%", "score": -0.45}
```
    """
    try:
        logger.info(f"POST /predict/anomaly — {data.model_dump()}")
        return prediction_service.detect_anomaly(data.model_dump())
    except Exception as e:
        logger.error(f"Error in /predict/anomaly: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}") from e


@router.post("/failure")
async def predict_failure(data: MetricInput):
    """
    Predict server failure probability.

    Example request body:
```json
    {"cpuUsage": 92, "memoryUsage": 85, "diskUsage": 90}
```

    Example response:
```json
    {"willFail": true, "probability": 0.82, "riskLevel": "critical", "recommendations": [...]}
```
    """
    try:
        logger.info(f"POST /predict/failure — {data.model_dump()}")
        return prediction_service.predict_failure(data.model_dump())
    except Exception as e:
        logger.error(f"Error in /predict/failure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}") from e


@router.post("/log-classify")
async def classify_log(data: LogInput):
    """
    Classify a log message into a category.

    Example request body:
```json
    {"message": "Database connection timeout after 30 seconds", "service": "user-service"}
```

    Example response:
```json
    {"category": "Database Error", "confidence": 0.89, "severity": "error", "originalMessage": "..."}
```
    """
    try:
        logger.info(f"POST /predict/log-classify — '{data.message[:50]}...'")
        return prediction_service.classify_log(data.model_dump())
    except Exception as e:
        logger.error(f"Error in /predict/log-classify: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}") from e


@router.post("/full")
async def full_analysis(data: MetricInput):
    """
    Run all metric-based analyses in one call.
    Returns anomaly result + failure result + combined health score.
    """
    try:
        logger.info(f"POST /predict/full — {data.model_dump()}")
        return prediction_service.full_analysis(data.model_dump())
    except Exception as e:
        logger.error(f"Error in /predict/full: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}") from e