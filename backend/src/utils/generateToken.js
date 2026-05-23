const jwt = require('jsonwebtoken')

/**
 * Generates JWT token for authenticated users.
 * token contains payload data (usually user ID and role)
 * and is signed using secret key from environment variables.
 */

const generateToken = (payload, expiresIn = '1d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Stores JWT token securely inside browser cookie.
 * cookie is HTTP-only for security and expires after 1 day.
 */

const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24*60*60*1000,
    });
};

module.exports = { generateToken, setTokenCookie };