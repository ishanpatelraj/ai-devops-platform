/**
 * Simple logger utility for the backend.
 * In production this can be replaced with winston/pino.
 */
const logger = {
    info:  (...args) => console.log ('[INFO] ', ...args),
    warn:  (...args) => console.warn ('[WARN] ', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => process.env.NODE_ENV !== 'production' && console.debug('[DEBUG]', ...args),
};

module.exports = logger;
