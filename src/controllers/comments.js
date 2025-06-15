// TODO: Implement comments controller
// This controller should handle:
// - Creating comments on posts
// - Editing user's own comments
// - Deleting user's own comments
// - Getting comments for a post
// - Pagination for comments

const {
    createComment,
    updateComment,
    deleteComment,
    getPostComments,
    getCommentById,
} = require("../models/comment.js");
const logger = require("../utils/logger");

/**
 * Create a new comment
 */
const create = async (req, res) => {
    try {
        const { post_id, content } = req.validatedData;
        const userId = req.user.id;

        const comment = await createComment({
            user_id: userId,
            post_id,
            content,
        });

        logger.verbose(`User ${userId} created comment ${comment.id} on post ${post_id}`);

        res.status(201).json({
            message: "Comment created successfully",
            comment,
        });
    } catch (error) {
        logger.critical("Create comment error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update a comment
 */
const update = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { content } = req.validatedData;
        const userId = req.user.id;

        // First check if comment exists and belongs to user
        const comment = await getCommentById(parseInt(comment_id));
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (comment.user_id !== userId) {
            return res.status(403).json({ error: "Not authorized to update this comment" });
        }

        const updated = await updateComment(parseInt(comment_id), { content });
        if (!updated) {
            return res.status(404).json({ error: "Comment not found" });
        }

        logger.verbose(`User ${userId} updated comment ${comment_id}`);

        res.json({
            message: "Comment updated successfully",
        });
    } catch (error) {
        logger.critical("Update comment error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete a comment
 */
const deleteCommentCtrl = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const userId = req.user.id;

        // First check if comment exists and belongs to user
        const comment = await getCommentById(parseInt(comment_id));
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (comment.user_id !== userId) {
            return res.status(403).json({ error: "Not authorized to delete this comment" });
        }

        const deleted = await deleteComment(parseInt(comment_id), userId);
        if (!deleted) {
            return res.status(404).json({ error: "Comment not found" });
        }

        logger.verbose(`User ${userId} deleted comment ${comment_id}`);

        res.json({
            message: "Comment deleted successfully",
        });
    } catch (error) {
        logger.critical("Delete comment error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get comments for a post with pagination
 */
const getPostCommentsCtrl = async (req, res) => {
    try {
        const { post_id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const comments = await getPostComments(parseInt(post_id));
        
        logger.verbose(`Fetching comments for post ${post_id}, page ${page}, limit ${limit}`);

        res.json({
            comments,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: comments.length,
            },
        });
    } catch (error) {
        logger.critical("Get post comments error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    create,
    update,
    delete: deleteCommentCtrl,
    getPostComments: getPostCommentsCtrl,
};
