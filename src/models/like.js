const { query } = require("../utils/database");

/**
 * Like model for database operations
 */

/**
 * Like a post
 * @param {Object} likeData - Like data
 * @returns {Promise<boolean>} Success status
 * @throws {Error} If database operation fails
 */
const likePost = async ({
    user_id,
    post_id,
}) => {
    const result = await query(
        `INSERT INTO likes (user_id, post_id)
         VALUES ($1, $2)
         RETURNING id`,
        [user_id, post_id]
    );

    return result.rows.length > 0;
};

/**
 * Unlike a post
 * @param {Object} unlikeData - Unlike data
 * @returns {Promise<boolean>} Success status
 * @throws {Error} If database operation fails
 */
const unlikePost = async ({
    user_id,
    post_id,
}) => {
    const result = await query(
        `DELETE FROM likes 
         WHERE user_id = $1 
         AND post_id = $2
         RETURNING id`,
        [user_id, post_id]
    );

    return result.rows.length > 0;
};

/**
 * Get likes for a post
 * @param {number} postId - ID of the post
 * @returns {Promise<Array>} Array of likes with user info
 * @throws {Error} If database operation fails
 */
const getPostLikes = async (post_id) => {
    const result = await query(
        `SELECT l.*, u.username, u.full_name 
         FROM likes l 
         JOIN users u ON l.user_id = u.id 
         WHERE l.post_id = $1 
         ORDER BY l.created_at DESC`,
        [post_id]
    );

    return result.rows;
};

/**
 * Get likes made by a user
 * @param {number} userId - ID of the user
 * @returns {Promise<Array>} Array of likes with post info
 * @throws {Error} If database operation fails
 */
const getUserLikes = async (user_id) => {
    const result = await query(
        `SELECT l.*, p.content, u.username as post_owner 
         FROM likes l 
         JOIN posts p ON l.post_id = p.id 
         JOIN users u ON p.user_id = u.id 
         WHERE l.user_id = $1 
         ORDER BY l.created_at DESC`,
        [user_id]
    );

    return result.rows;
};

/**
 * Check if a user has liked a post
 * @param {number} userId - ID of the user
 * @param {number} postId - ID of the post
 * @returns {Promise<boolean>} True if user has liked the post
 * @throws {Error} If database operation fails
 */
const hasUserLikedPost = async ({
    user_id,
    post_id,
}) => {
    const result = await query(
        `SELECT EXISTS (
            SELECT 1 FROM likes 
            WHERE user_id = $1 
            AND post_id = $2
        ) as has_liked`,
        [user_id, post_id]
    );

    return result.rows[0].has_liked;
};

module.exports = {
    likePost,
    unlikePost,
    getPostLikes,
    getUserLikes,
    hasUserLikedPost,
};
