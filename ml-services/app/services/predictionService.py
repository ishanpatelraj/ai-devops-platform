"""
Prediction Service.

Orchestrates all ML predictions:
  validate → preprocess → invoke model → format response

Routes call this service; this service calls models.
Models never touch request/response objects.
"""

from app.models.anomalyModel       import anomaly_detector
from app.models.failurePredictionModel import failure_predictor
from app.models.logClassifierModel  import log_classifier
from app.utils.preprocess           import preprocess_metrics, preprocess_log, validate_metric_data
from app.utils.logger               import logger


class PredictionService:
    """Service class that orchestrates all ML predictions."""

    # ── Anomaly Detection ────────────────────────────────────────────────────

    def detect_anomaly(self, metric_data: dict) -> dict:
        """
        Detect anomalies in system metrics.

        Flow: validate → preprocess → Isolation Forest → format
        """
        logger.info(f"Anomaly detection requested: {metric_data}")

        if not validate_metric_data(metric_data):
            return {"isAnomaly": False, "confidence": 0.0, "details": "Invalid input", "error": True}

        features = preprocess_metrics(metric_data)
        result   = anomaly_detector.predict(features)

        # Attach original metrics so the frontend can display them alongside the result
        result["metrics"] = {k: metric_data.get(k) for k in ("cpuUsage", "memoryUsage", "diskUsage")}
        return result

    # ── Failure Prediction ───────────────────────────────────────────────────

    def predict_failure(self, metric_data: dict) -> dict:
        """
        Predict probability of server failure.

        Flow: validate → preprocess → Random Forest → format + recommendations
        """
        logger.info(f"Failure prediction requested: {metric_data}")

        if not validate_metric_data(metric_data):
            return {"willFail": False, "probability": 0.0, "riskLevel": "unknown",
                    "recommendations": ["Invalid input"], "error": True}

        features = preprocess_metrics(metric_data)
        result   = failure_predictor.predict(features)
        result["metrics"] = {k: metric_data.get(k) for k in ("cpuUsage", "memoryUsage", "diskUsage")}
        return result

    # ── Log Classification ───────────────────────────────────────────────────

    def classify_log(self, log_data: dict) -> dict:
        """
        Classify a log message into a category.

        Flow: extract → preprocess text → Naive Bayes → format
        """
        log_message = log_data.get("message", "")

        if not log_message:
            return {"category": "Unknown", "confidence": 0.0, "severity": "info", "error": "No message provided"}

        logger.info(f"Log classification requested: '{log_message[:50]}...'")

        cleaned = preprocess_log(log_message)
        result  = log_classifier.classify(cleaned)
        result["originalMessage"] = log_message   # Return original for display purposes
        return result

    # ── Full Analysis (convenience endpoint) ────────────────────────────────

    def full_analysis(self, metric_data: dict) -> dict:
        """
        Run anomaly detection AND failure prediction in one call.
        Returns both results plus a combined health score (0–100).
        """
        logger.info("Full analysis requested")

        anomaly_result = self.detect_anomaly(metric_data)
        failure_result = self.predict_failure(metric_data)

        return {
            "anomaly":       anomaly_result,
            "failure":       failure_result,
            "overallHealth": self._calculate_overall_health(anomaly_result, failure_result)
        }

    # ── Internal Helpers ─────────────────────────────────────────────────────

    def _calculate_overall_health(self, anomaly_result: dict, failure_result: dict) -> dict:
        """
        Derives a 0–100 health score from individual prediction results.

        Scoring logic:
        - Anomaly confidence can reduce score by up to 30 points
        - Failure probability can reduce score by up to 70 points
        - 80–100 → healthy | 50–79 → degraded | 25–49 → unhealthy | 0–24 → critical
        """
        score = 100.0

        if anomaly_result.get("isAnomaly"):
            score -= anomaly_result.get("confidence", 0) * 30

        score -= failure_result.get("probability", 0) * 70
        score  = max(0, min(100, score))

        if score >= 80:
            status = "healthy"
        elif score >= 50:
            status = "degraded"
        elif score >= 25:
            status = "unhealthy"
        else:
            status = "critical"

        return {"score": round(score, 1), "status": status}


# Singleton used by routes
prediction_service = PredictionService()