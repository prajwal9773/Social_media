const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { like, unlike, getPostLikes, getUserLikes } = require("../controllers/likes");

const router = express.Router();

/**
 * Like a post
 * @route POST /api/likes
 * @param {Object} req.body - Like data
 * @param {number} req.body.post_id - Post ID
 * @returns {Object} Success message
 * @throws {Error} If authentication fails or like operation fails
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        await like(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Unlike a post
 * @route DELETE /api/likes/:post_id
 * @param {number} req.params.post_id - Post ID
 * @returns {Object} Success message
 * @throws {Error} If authentication fails or unlike operation fails
 */
router.delete("/:post_id", authenticateToken, async (req, res) => {
    try {
        await unlike(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get likes for a post
 * @route GET /api/likes/post/:post_id
 * @param {number} req.params.post_id - Post ID
 * @param {number} req.query.page - Page number (optional)
 * @param {number} req.query.limit - Items per page (optional)
 * @returns {Object} Array of likes with pagination
 * @throws {Error} If database operation fails
 */
router.get("/post/:post_id", async (req, res) => {
    try {
        await getPostLikes(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get posts liked by a user
 * @route GET /api/likes/user/:user_id
 * @param {number} req.params.user_id - User ID
 * @param {number} req.query.page - Page number (optional)
 * @param {number} req.query.limit - Items per page (optional)
 * @returns {Object} Array of liked posts with pagination
 * @throws {Error} If database operation fails
 */
router.get("/user/:user_id", async (req, res) => {
    try {
        await getUserLikes(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
