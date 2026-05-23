"""
Preprocessing utility for the ML service.
Handles data cleaning and normalisation before feeding to models.
"""

import numpy as np
from app.utils.logger import logger


def preprocess_metrics(data: dict) -> np.ndarray:
    """
    Preprocesses incoming metric data for anomaly detection and failure prediction.

    Expected input:
    {
        "cpuUsage": 75.5,      # Percentage 0-100
        "memoryUsage": 60.2,   # Percentage 0-100
        "diskUsage": 45.0,     # Percentage 0-100
        "networkIn": 1000,     # Bytes/sec (optional)
        "networkOut": 500      # Bytes/sec (optional)
    }

    Returns:
        numpy array of shape (1, 5) with all values normalised to 0-1
    """
    try:
        cpu    = float(data.get("cpuUsage",    0))
        memory = float(data.get("memoryUsage", 0))
        disk   = float(data.get("diskUsage",   0))
        net_in  = float(data.get("networkIn",  0))
        net_out = float(data.get("networkOut", 0))

        # CPU, Memory, Disk are already percentages — divide by 100
        cpu_norm    = cpu    / 100.0
        memory_norm = memory / 100.0
        disk_norm   = disk   / 100.0

        # Network: cap at an assumed max of 10,000 bytes/sec
        net_in_norm  = min(net_in  / 10000.0, 1.0)
        net_out_norm = min(net_out / 10000.0, 1.0)

        features = np.array([[cpu_norm, memory_norm, disk_norm, net_in_norm, net_out_norm]])

        logger.info(f"Preprocessed metrics: CPU={cpu}%, MEM={memory}%, DISK={disk}%")
        return features

    except Exception as e:
        logger.error(f"Error preprocessing metrics: {str(e)}")
        return np.array([[0.0, 0.0, 0.0, 0.0, 0.0]])


def preprocess_log(log_message: str) -> str:
    """
    Preprocesses a raw log message for text classification.

    Steps:
    1. Lowercase everything
    2. Collapse multiple spaces into one
    3. Strip leading/trailing whitespace

    Args:
        log_message: Raw log string from the agent

    Returns:
        Cleaned lowercase string
    """
    try:
        cleaned = log_message.lower()
        cleaned = " ".join(cleaned.split())
        cleaned = cleaned.strip()

        logger.info(f"Preprocessed log: '{cleaned[:50]}...'")
        return cleaned

    except Exception as e:
        logger.error(f"Error preprocessing log: {str(e)}")
        return ""


def validate_metric_data(data: dict) -> bool:
    """
    Validates that incoming metric data has all required fields
    and that each value is a valid number.

    Args:
        data: Dictionary of metric data from the request

    Returns:
        True if valid, False otherwise
    """
    required_fields = ["cpuUsage", "memoryUsage", "diskUsage"]

    for field in required_fields:
        if field not in data:
            logger.warning(f"Missing required field: {field}")
            return False
        try:
            float(data[field])
        except (ValueError, TypeError):
            logger.warning(f"Invalid value for {field}: {data[field]}")
            return False

    return True