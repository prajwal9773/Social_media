const { query } = require("../utils/database");

/**
 * Comment model for database operations
 */

/**
 * Create a new comment
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object>} Created comment
 * @throws {Error} If database operation fails
 */
const createComment = async ({
    user_id,
    post_id,
    content,
}) => {
    const result = await query(
        `INSERT INTO comments (user_id, post_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, post_id, content, created_at, updated_at`,
        [user_id, post_id, content]
    );

    return result.rows[0];
};

/**
 * Get comment by ID
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object|null>} Comment object or null
 * @throws {Error} If database operation fails
 */
const getCommentById = async (commentId) => {
    const result = await query(
        `SELECT c.*, u.username 
         FROM comments c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.id = $1 
         AND c.is_deleted = FALSE`,
        [commentId]
    );

    return result.rows[0] || null;
};

/**
 * Get all comments for a post
 * @param {number} postId - Post ID
 * @returns {Promise<Array>} Array of comments
 * @throws {Error} If database operation fails
 */
const getPostComments = async (postId) => {
    const result = await query(
        `SELECT c.*, u.username 
         FROM comments c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.post_id = $1 
         AND c.is_deleted = FALSE 
         ORDER BY c.created_at DESC`,
        [postId]
    );

    return result.rows;
};

/**
 * Update a comment
 * @param {number} commentId - Comment ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<boolean>} Success status
 * @throws {Error} If database operation fails
 */
const updateComment = async (commentId, { content }) => {
    const result = await query(
        `UPDATE comments 
         SET content = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id`,
        [content, commentId]
    );

    return result.rows.length > 0;
};

/**
 * Delete a comment
 * @param {number} commentId - Comment ID
 * @param {number} userId - User ID (for ownership verification)
 * @returns {Promise<boolean>} Success status
 * @throws {Error} If database operation fails
 */
const deleteComment = async (commentId, userId) => {
    const result = await query(
        `DELETE FROM comments 
         WHERE id = $1 
         AND user_id = $2
         RETURNING id`,
        [commentId, userId]
    );

    return result.rows.length > 0;
};

module.exports = {
    createComment,
    getCommentById,
    getPostComments,
    updateComment,
    deleteComment,
};
