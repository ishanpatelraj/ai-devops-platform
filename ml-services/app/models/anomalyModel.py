"""
Anomaly Detection Model — Isolation Forest.

How Isolation Forest works:
- Randomly selects a feature and a split value to isolate data points
- Normal points require many splits to isolate (long path)
- Anomalies are isolated quickly (short path)
- Points with short average path lengths are flagged as anomalies
"""

import joblib
import numpy as np
import os
from app.utils.logger import logger

MODEL_PATH = os.getenv("MODEL_PATH", "./saved_models")
ANOMALY_MODEL_FILE = os.path.join(MODEL_PATH, "anomaly_model.pkl")


class AnomalyDetector:
    """Anomaly Detection using Isolation Forest."""

    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        """Load the pre-trained anomaly detection model from disk."""
        try:
            if os.path.exists(ANOMALY_MODEL_FILE):
                self.model = joblib.load(ANOMALY_MODEL_FILE)
                logger.info("Anomaly detection model loaded successfully")
            else:
                logger.warning(f"Model file not found: {ANOMALY_MODEL_FILE}")
        except Exception as e:
            logger.error(f"Error loading anomaly model: {str(e)}")

    def predict(self, features: np.ndarray) -> dict:
        """
        Predict whether the given metrics represent an anomaly.

        Args:
            features: numpy array of shape (1, 5) — normalised metrics

        Returns:
            {isAnomaly, confidence, details, score}
        """
        try:
            if self.model is None:
                return self._rule_based_detection(features)

            # Isolation Forest returns 1 (normal) or -1 (anomaly)
            prediction    = self.model.predict(features)
            anomaly_score = self.model.decision_function(features)

            is_anomaly = prediction[0] == -1
            confidence  = min(abs(float(anomaly_score[0])), 1.0)
            details     = self._generate_details(features[0]) if is_anomaly else "System metrics within normal range"

            result = {
                "isAnomaly": bool(is_anomaly),
                "confidence": round(confidence, 3),
                "details": details,
                "score": round(float(anomaly_score[0]), 4)
            }

            logger.info(f"Anomaly prediction: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in anomaly prediction: {str(e)}")
            return {"isAnomaly": False, "confidence": 0.0, "details": f"Error: {str(e)}", "score": 0.0}

    def _rule_based_detection(self, features: np.ndarray) -> dict:
        """
        Fallback when model is unavailable.
        Rules: CPU > 90% OR Memory > 90% OR Disk > 95% → anomaly.
        """
        cpu    = features[0][0] * 100
        memory = features[0][1] * 100
        disk   = features[0][2] * 100

        if cpu > 90:
            return {"isAnomaly": True,  "confidence": 0.90, "details": f"Critical CPU: {cpu:.1f}%",    "score": -0.9}
        if memory > 90:
            return {"isAnomaly": True,  "confidence": 0.85, "details": f"Critical Memory: {memory:.1f}%", "score": -0.85}
        if disk > 95:
            return {"isAnomaly": True,  "confidence": 0.95, "details": f"Critical Disk: {disk:.1f}%",   "score": -0.95}
        if cpu > 80 and memory > 80:
            return {"isAnomaly": True,  "confidence": 0.70, "details": f"High CPU+MEM: {cpu:.1f}%/{memory:.1f}%", "score": -0.7}

        return {"isAnomaly": False, "confidence": 0.0, "details": "System normal", "score": 0.1}

    def _generate_details(self, features: np.ndarray) -> str:
        """Generate a human-readable description of the detected anomaly."""
        cpu    = features[0] * 100
        memory = features[1] * 100
        disk   = features[2] * 100

        parts = []
        if cpu    > 80: parts.append(f"High CPU: {cpu:.1f}%")
        if memory > 80: parts.append(f"High Memory: {memory:.1f}%")
        if disk   > 85: parts.append(f"High Disk: {disk:.1f}%")

        return "Anomaly detected — " + ", ".join(parts) if parts else "Unusual metric pattern detected"


# Singleton used by the service layer
anomaly_detector = AnomalyDetector()