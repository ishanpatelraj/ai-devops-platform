const axios = require("axios");

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * anomaly detection
 * return prediction res
 * @param {Object} metricData - { serverId, cpuUsage, memoryUsage, diskUsage }
 */

const detectAnomaly = async (metricData) => {
    try {
        const response = await axios.post(`${ML_BASE_URL}/predict/anomaly`, metricData, {
            timeout: 5000,
        });
        return response.data;
    }
    catch(error){
        console.error("ML Service (anomaly) unavailable: ", error.message);
        return null;
    }
};

/**
 * it sends metric data to the ml  part for any failure to predict
 * returns model crash prob and recommendataions
 * @param {object} metricData - { serverId, cpuUsage, memoryUsage, diskUsage}
 */

const predictFailure = async (metricData) => {
    try{
        const response = await axios.post(`${ML_BASE_URL}/predict/failure`, metricData, {
            timeout: 5000,
        });
        return response.data;
    }
    catch(error){
        console.error(" ML Service (failure) unavailable: ", error.message);
        return null;
    }
};

/**
 * sends log message to the ml service for classification
 * return the log category (e.g. "database error", "Network Issue").
 * @param {string} logMessage - The raw log message text
 */

const classifyLog = async (logMessage) => {
    try{
        const response = await axios.post(
            `${ML_BASE_URL}/predict/log-classify`,
            {message: logMessage},
            {timeout: 5000}
        );
        return response.data;
    }
    catch(error){
        console.log("ML Service (classify) unavailable: ", error.message);
        return null;
    }
};

module.exports = { detectAnomaly, predictFailure, classifyLog };

