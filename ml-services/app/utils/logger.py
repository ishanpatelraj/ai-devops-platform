"""
Logger utility for the ML service.
Provides consistent, levelled logging across all modules.
"""

import logging
import os
from dotenv import load_dotenv

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


def setup_logger(name: str = "ml-service") -> logging.Logger:
    """
    Creates and configures a logger instance.

    Args:
        name: Name for the logger (shown in every log line)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))

    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))

    # Format: "2024-01-15 14:32:01 - ml-service - INFO - Server started"
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    console_handler.setFormatter(formatter)

    # Guard against duplicate handlers if module is reloaded
    if not logger.handlers:
        logger.addHandler(console_handler)

    return logger


# Singleton — import this directly in other files
logger = setup_logger()