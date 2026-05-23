const STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
};

const SEVERITY = {
    INFO: "INFO",
    WARNING: "WARNING",
    ERROR: "ERROR",
    CRITICAL: "CRITICAL",
};

const ALERT_TYPES = {
    CPU: "CPU",
    MEMORY: "MEMORY",
    DISK: "DISK",
    SERVICE_DOWN: "SERVICE_DOWN",
    ML_ANOMALY: "ML_ANOMALY",
};

const PREDICTION_TYPES = {
    ANOMALY: "anomaly",
    FAILURE: "failure",
    LOG_CLASSIFICATION: "log_classification",
};

module.exports = { STATUS, SEVERITY, ALERT_TYPES, PREDICTION_TYPES };