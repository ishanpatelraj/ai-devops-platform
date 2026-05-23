"""
Log Classification Model — Naive Bayes + TF-IDF Pipeline.

How it works:
1. TF-IDF vectoriser converts each log string into a numerical feature vector
   (words unique to a category score higher than common words)
2. Multinomial Naive Bayes calculates P(category | words) for all categories
3. The category with the highest probability is the prediction

The two steps are wrapped in a sklearn Pipeline so the same
preprocessing is applied automatically during both training and prediction.
"""

import joblib
import os
from app.utils.logger import logger

MODEL_PATH = os.getenv("MODEL_PATH", "./saved_models")
LOG_MODEL_FILE = os.path.join(MODEL_PATH, "log_classifier.pkl")


class LogClassifier:
    """Log Classification using a TF-IDF + Naive Bayes Pipeline."""

    CATEGORIES = [
        "Database Error", "Network Error", "Authentication Error",
        "System Error", "Application Error", "Security Warning",
        "Performance Warning", "Info"
    ]

    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        """Load the pre-trained log classification pipeline from disk."""
        try:
            if os.path.exists(LOG_MODEL_FILE):
                self.model = joblib.load(LOG_MODEL_FILE)
                logger.info("Log classifier model loaded successfully")
            else:
                logger.warning(f"Model file not found: {LOG_MODEL_FILE}")
        except Exception as e:
            logger.error(f"Error loading log classifier: {str(e)}")

    def classify(self, log_message: str) -> dict:
        """
        Classify a preprocessed log message into a category.

        Args:
            log_message: Lowercased, cleaned log string

        Returns:
            {category, confidence, severity}
        """
        try:
            if self.model is None:
                return self._keyword_based_classification(log_message)

            prediction   = self.model.predict([log_message])
            probabilities = self.model.predict_proba([log_message])
            confidence   = float(max(probabilities[0]))
            category     = prediction[0]

            result = {
                "category": category,
                "confidence": round(confidence, 3),
                "severity": self._get_severity(category)
            }

            logger.info(f"Log classified: '{log_message[:30]}...' → {category}")
            return result

        except Exception as e:
            logger.error(f"Error classifying log: {str(e)}")
            return {"category": "Unknown", "confidence": 0.0, "severity": "info"}

    def _keyword_based_classification(self, log_message: str) -> dict:
        """
        Fallback keyword matching when the trained model is unavailable.
        Each category has a list of trigger words; first match wins.
        """
        keyword_map = {
            "Database Error":        ["database", "db", "mysql", "mongo", "query failed", "sql", "postgres", "redis", "connection timeout"],
            "Network Error":         ["network", "timeout", "dns", "socket", "connection reset", "unreachable", "502", "503", "504"],
            "Authentication Error":  ["auth", "login failed", "unauthorized", "forbidden", "invalid token", "401", "403"],
            "System Error":          ["kernel", "segfault", "out of memory", "oom", "disk full", "fatal", "core dump"],
            "Application Error":     ["exception", "stack trace", "null pointer", "undefined", "crash", "failed"],
            "Security Warning":      ["sql injection", "brute force", "attack", "malware", "suspicious", "intrusion"],
            "Performance Warning":   ["slow", "latency", "high cpu", "memory leak", "bottleneck", "degraded"]
        }

        message_lower = log_message.lower()
        for category, keywords in keyword_map.items():
            for keyword in keywords:
                if keyword in message_lower:
                    return {"category": category, "confidence": 0.75, "severity": self._get_severity(category)}

        return {"category": "Info", "confidence": 0.5, "severity": "info"}

    def _get_severity(self, category: str) -> str:
        """Maps log category to a severity level used by the dashboard."""
        severity_map = {
            "Database Error":       "error",
            "Network Error":        "error",
            "Authentication Error": "warning",
            "System Error":         "critical",
            "Application Error":    "error",
            "Security Warning":     "critical",
            "Performance Warning":  "warning",
            "Info":                 "info"
        }
        return severity_map.get(category, "info")


# Singleton used by the service layer
log_classifier = LogClassifier()