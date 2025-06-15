const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { createComment, updateComment, deleteComment, getPostComments, getCommentById } = require("../models/comment");

const router = express.Router();

/**
 * Create a comment on a post
 * @route POST /api/comments
 * @param {Object} req.body - Comment data
 * @param {number} req.body.post_id - Post ID
 * @param {string} req.body.content - Comment content
 * @returns {Object} Created comment
 * @throws {Error} If authentication fails or comment creation fails
 */
router.post("/", authenticateToken, async (req, res) => {
    try {
        const comment = await createComment({
            user_id: req.user.id,
            post_id: req.body.post_id,
            content: req.body.content,
        });
        res.status(201).json(comment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * Update a comment
 * @route PUT /api/comments/:comment_id
 * @param {number} req.params.comment_id - Comment ID
 * @param {Object} req.body - Comment data
 * @param {string} req.body.content - New comment content
 * @returns {Object} Updated comment
 * @throws {Error} If authentication fails, comment not found, or update fails
 */
router.put("/:comment_id", authenticateToken, async (req, res) => {
    try {
        const comment = await getCommentById(req.params.comment_id);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (comment.user_id !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to update this comment" });
        }

        const updated = await updateComment(req.params.comment_id, req.body);
        if (!updated) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.json({ message: "Comment updated successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * Delete a comment
 * @route DELETE /api/comments/:comment_id
 * @param {number} req.params.comment_id - Comment ID
 * @returns {Object} Success message
 * @throws {Error} If authentication fails, comment not found, or deletion fails
 */
router.delete("/:comment_id", authenticateToken, async (req, res) => {
    try {
        const comment = await getCommentById(req.params.comment_id);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (comment.user_id !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to delete this comment" });
        }

        const deleted = await deleteComment(req.params.comment_id);
        if (!deleted) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * Get comments for a post
 * @route GET /api/comments/post/:post_id
 * @param {number} req.params.post_id - Post ID
 * @returns {Array} Array of comments
 * @throws {Error} If database operation fails
 */
router.get("/post/:post_id", async (req, res) => {
    try {
        const comments = await getPostComments(req.params.post_id);
        res.json(comments);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * Get a specific comment
 * @route GET /api/comments/:comment_id
 * @param {number} req.params.comment_id - Comment ID
 * @returns {Object} Comment object
 * @throws {Error} If comment not found or database operation fails
 */
router.get("/:comment_id", async (req, res) => {
    try {
        const comment = await getCommentById(req.params.comment_id);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        res.json(comment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
