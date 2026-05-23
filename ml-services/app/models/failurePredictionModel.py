"""
Failure Prediction Model — Random Forest Classifier.

How Random Forest works:
- Trains many independent decision trees on random subsets of the data
- Each tree independently votes "will fail" or "won't fail"
- Final prediction = majority vote across all trees
- predict_proba() gives the fraction of trees that voted each way
"""

import joblib
import numpy as np
import os
from app.utils.logger import logger

MODEL_PATH = os.getenv("MODEL_PATH", "./saved_models")
FAILURE_MODEL_FILE = os.path.join(MODEL_PATH, "failure_model.pkl")


class FailurePredictor:
    """Failure Prediction using Random Forest Classifier."""

    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        """Load the pre-trained failure prediction model from disk."""
        try:
            if os.path.exists(FAILURE_MODEL_FILE):
                self.model = joblib.load(FAILURE_MODEL_FILE)
                logger.info("Failure prediction model loaded successfully")
            else:
                logger.warning(f"Model file not found: {FAILURE_MODEL_FILE}")
        except Exception as e:
            logger.error(f"Error loading failure model: {str(e)}")

    def predict(self, features: np.ndarray) -> dict:
        """
        Predict failure probability for given normalised metrics.

        Args:
            features: numpy array of shape (1, 5)

        Returns:
            {willFail, probability, riskLevel, recommendations}
        """
        try:
            if self.model is None:
                return self._rule_based_prediction(features)

            prediction   = self.model.predict(features)
            # predict_proba returns [[p_no_fail, p_fail]]
            probabilities = self.model.predict_proba(features)
            failure_prob  = float(probabilities[0][1])

            result = {
                "willFail": bool(prediction[0] == 1),
                "probability": round(failure_prob, 3),
                "riskLevel": self._get_risk_level(failure_prob),
                "recommendations": self._generate_recommendations(features[0], failure_prob)
            }

            logger.info(f"Failure prediction: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in failure prediction: {str(e)}")
            return {"willFail": False, "probability": 0.0, "riskLevel": "unknown", "recommendations": [f"Error: {str(e)}"]}

    def _rule_based_prediction(self, features: np.ndarray) -> dict:
        """
        Fallback weighted risk score when model is unavailable.
        CPU (35%) + Memory (30%) + Disk (20%) + Network (15%) = risk score.
        """
        cpu     = features[0][0]
        memory  = features[0][1]
        disk    = features[0][2]
        net_in  = features[0][3]
        net_out = features[0][4]

        risk = (cpu * 0.35 + memory * 0.30 + disk * 0.20 + net_in * 0.10 + net_out * 0.05)

        # Exponential penalty for critically high values
        if cpu > 0.9 or memory > 0.9:
            risk = min(risk * 1.5, 1.0)

        return {
            "willFail": risk > 0.7,
            "probability": round(risk, 3),
            "riskLevel": self._get_risk_level(risk),
            "recommendations": self._generate_recommendations(features[0], risk)
        }

    def _get_risk_level(self, probability: float) -> str:
        """
        Maps a probability score to a human-readable risk label.
        < 0.25 → low | 0.25–0.50 → medium | 0.50–0.75 → high | > 0.75 → critical
        """
        if probability < 0.25: return "low"
        if probability < 0.50: return "medium"
        if probability < 0.75: return "high"
        return "critical"

    def _generate_recommendations(self, features: np.ndarray, probability: float) -> list:
        """Actionable recommendations based on the current metric values and risk level."""
        recommendations = []
        cpu    = features[0] * 100
        memory = features[1] * 100
        disk   = features[2] * 100

        if cpu    > 80: recommendations.append(f"CPU at {cpu:.0f}% — scale horizontally or optimise processes")
        if memory > 80: recommendations.append(f"Memory at {memory:.0f}% — check for leaks or increase RAM")
        if disk   > 85: recommendations.append(f"Disk at {disk:.0f}% — clean logs or expand storage")

        if probability > 0.7:
            recommendations.append("CRITICAL: Immediate attention required — server at high risk of failure")
        elif probability > 0.5:
            recommendations.append("WARNING: Monitor closely and prepare failover")

        if not recommendations:
            recommendations.append("System healthy — no immediate action needed")

        return recommendations


# Singleton used by the service layer
failure_predictor = FailurePredictor()