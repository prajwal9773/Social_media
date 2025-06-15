const jwt = require("jsonwebtoken");
const logger = require("./logger");

/**
 * Generate JWT token for user authentication
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        logger.error("JWT verification failed:", error);
        throw error;
    }
};

module.exports = {
    generateToken,
    verifyToken,
};
