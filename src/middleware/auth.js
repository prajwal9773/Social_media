const { verifyToken } = require("../utils/jwt");
const { getUserById } = require("../models/user");
const logger = require("../utils/logger");

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];

        if (!authHeader) {
            return res.status(401).json({ 
                error: "Access token required",
                message: "Please provide a valid JWT token in the Authorization header"
            });
        }

        // Try to extract token from various formats
        let token;
        
        // Try Bearer token format
        const bearerMatch = authHeader.match(/^Bearer\s+(.+)/);
        if (bearerMatch) {
            token = bearerMatch[1];
        } else {
            // Try raw token format
            token = authHeader.trim();
        }

        if (!token) {
            return res.status(401).json({ 
                error: "Invalid token format",
                message: "Token must be in format: Bearer <token> or just the token"
            });
        }

        try {
            const decoded = verifyToken(token);
            
            const user = await getUserById(decoded.userId);
            if (!user) {
                return res.status(401).json({ 
                    error: "User not found",
                    message: "The user associated with this token no longer exists"
                });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            logger.error("JWT verification failed:", jwtError);
            return res.status(401).json({ 
                error: "Invalid token",
                message: "The provided token is invalid or has expired"
            });
        }
    } catch (error) {
        logger.error("Authentication error:", error);
        return res.status(500).json({ 
            error: "Internal server error",
            message: "An unexpected error occurred during authentication"
        });
    }
};

/**
 * Middleware to optionally authenticate tokens (for endpoints that work with/without auth)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];

        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (token) {
                try {
                    const decoded = verifyToken(token);
                    const user = await getUserById(decoded.userId);
                    if (user) {
                        req.user = user;
                    }
                } catch (error) {
                    // If token verification fails, continue without user
                    logger.warn("Optional auth token verification failed:", error);
                }
            }
        }
        next();
    } catch (error) {
        logger.error("Optional auth error:", error);
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
};
