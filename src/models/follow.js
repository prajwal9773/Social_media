const { query } = require("../utils/database");

/**
 * Follow model for database operations
 */

/**
 * Follow a user
 * @param {number} followerId - ID of the user who is following
 * @param {number} followingId - ID of the user being followed
 * @returns {Promise<boolean>} Success status
 * @throws {Error} If database operation fails
 */
const followUser = async ({
    follower_id,
    following_id,
}) => {
    const result = await query(
        `INSERT INTO follows (follower_id, following_id)
         VALUES ($1, $2)
         RETURNING id`,
        [follower_id, following_id]
    );

    return result.rows.length > 0;
};

/**
 * Unfollow a user
 * @param {number} followerId - ID of the user who is unfollowing
 * @param {number} followingId - ID of the user being unfollowed
 * @returns {Promise<boolean>} Success status
 * @throws {Error} If database operation fails
 */
const unfollowUser = async ({
    follower_id,
    following_id,
}) => {
    const result = await query(
        `DELETE FROM follows 
         WHERE follower_id = $1 
         AND following_id = $2
         RETURNING id`,
        [follower_id, following_id]
    );

    return result.rows.length > 0;
};

/**
 * Get users that a user is following
 * @param {number} userId - ID of the user
 * @returns {Promise<Array>} Array of following users
 * @throws {Error} If database operation fails
 */
const getFollowing = async (userId) => {
    const result = await query(
        `SELECT f.*, u.username, u.full_name 
         FROM follows f 
         JOIN users u ON f.following_id = u.id 
         WHERE f.follower_id = $1 
         ORDER BY f.created_at DESC`,
        [userId]
    );

    return result.rows;
};

/**
 * Get users who are following a user
 * @param {number} userId - ID of the user
 * @returns {Promise<Array>} Array of follower users
 * @throws {Error} If database operation fails
 */
const getFollowers = async (userId) => {
    const result = await query(
        `SELECT f.*, u.username, u.full_name 
         FROM follows f 
         JOIN users u ON f.follower_id = u.id 
         WHERE f.following_id = $1 
         ORDER BY f.created_at DESC`,
        [userId]
    );

    return result.rows;
};

/**
 * Get follow counts for a user
 * @param {number} userId - ID of the user
 * @returns {Promise<Object>} Object with following and followers count
 * @throws {Error} If database operation fails
 */
const getFollowCounts = async (userId) => {
    const result = await query(
        `SELECT 
            (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count,
            (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count`,
        [userId]
    );

    return result.rows[0];
};

module.exports = {
    followUser,
    unfollowUser,
    getFollowing,
    getFollowers,
    getFollowCounts,
};
