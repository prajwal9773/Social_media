const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { follow, unfollow, getMyFollowing, getMyFollowers, getFollowCounts } = require("../controllers/users");
const { query } = require("../utils/database");

const router = express.Router();

/**
 * Follow a user
 * @route POST /api/users/follow
 * @param {Object} req.body - Follow data
 * @param {number} req.body.following_id - ID of user to follow
 * @returns {Object} Success message
 * @throws {Error} If authentication fails or follow operation fails
 */
router.post("/follow", authenticateToken, async (req, res) => {
    try {
        await follow(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Unfollow a user
 * @route DELETE /api/users/unfollow
 * @param {Object} req.body - Unfollow data
 * @param {number} req.body.following_id - ID of user to unfollow
 * @returns {Object} Success message
 * @throws {Error} If authentication fails or unfollow operation fails
 */
router.delete("/unfollow", authenticateToken, async (req, res) => {
    try {
        await unfollow(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get users that current user follows
 * @route GET /api/users/following
 * @param {number} req.query.page - Page number (optional)
 * @param {number} req.query.limit - Items per page (optional)
 * @returns {Object} Array of following users with pagination
 * @throws {Error} If database operation fails
 */
router.get("/following", authenticateToken, async (req, res) => {
    try {
        await getMyFollowing(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get users that follow current user
 * @route GET /api/users/followers
 * @param {number} req.query.page - Page number (optional)
 * @param {number} req.query.limit - Items per page (optional)
 * @returns {Object} Array of followers with pagination
 * @throws {Error} If database operation fails
 */
router.get("/followers", authenticateToken, async (req, res) => {
    try {
        await getMyFollowers(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get follow stats for current user
 * @route GET /api/users/stats
 * @returns {Object} Follow statistics
 * @throws {Error} If database operation fails
 */
router.get("/stats", authenticateToken, async (req, res) => {
    try {
        await getFollowCounts(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Search users by name
 * @route POST /api/users/search
 * @param {Object} req.body - Search data
 * @param {string} req.body.query - Search term
 * @returns {Object} Array of matching users
 * @throws {Error} If database operation fails
 */
router.post("/search", authenticateToken, async (req, res) => {
    try {
        const { query: searchQuery } = req.body;
        
        if (!searchQuery) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const result = await query(
            `SELECT id, username, full_name 
             FROM users 
             WHERE username ILIKE $1 
             OR full_name ILIKE $1 
             LIMIT 10`,
            [`%${searchQuery}%`]
        );

        res.json({ users: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
