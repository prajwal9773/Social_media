const { query } = require("../utils/database");

/**
 * Post model for database operations
 */

/**
 * Create a new post
 * @param {Object} postData - Post data
 * @returns {Promise<Object>} Created post
 */
const createPost = async ({
  user_id,
  content,
  media_url,
  comments_enabled = true,
}) => {
  const result = await query(
    `INSERT INTO posts (user_id, content, media_url, comments_enabled, created_at, is_deleted)
     VALUES ($1, $2, $3, $4, NOW(), true)
     RETURNING id, user_id, content, media_url, comments_enabled, created_at`,
    [user_id, content, media_url, comments_enabled],
  );

  return result.rows[0];
};

/**
 * Get post by ID
 * @param {number} postId - Post ID
 * @returns {Promise<Object|null>} Post object or null
 */
const getPostById = async (postId) => {
  const result = await query(
    `SELECT p.*, u.username, u.full_name
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1`,
    [postId],
  );

  return result.rows[0] || null;
};

/**
 * Get posts by user ID
 * @param {number} userId - User ID
 * @param {number} limit - Number of posts to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of posts
 */
const getPostsByUserId = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT p.*, u.username, u.full_name
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  return result.rows;
};

/**
 * Get posts from users that the given user follows
 * @param {number} userId - User ID to get feed for
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of posts per page
 * @returns {Promise<{posts: Array, total: number}>} Paginated posts and total count
 */
const getFeedPosts = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  // Get posts from followed users and the user's own posts
  const result = await query(
    `WITH followed_users AS (
        SELECT following_id FROM follows WHERE follower_id = $1
      )
      SELECT 
        p.*,
        u.username,
        u.full_name,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id AND c.is_deleted = false
      WHERE (p.user_id IN (SELECT following_id FROM followed_users) OR p.user_id = $1)
      AND p.is_deleted = false
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  // Get total count for pagination
  const totalCountResult = await query(
    `WITH followed_users AS (
        SELECT following_id FROM follows WHERE follower_id = $1
      )
      SELECT COUNT(*)
      FROM posts p
      WHERE (p.user_id IN (SELECT following_id FROM followed_users) OR p.user_id = $1)
      AND p.is_deleted = false`,
    [userId]
  );

  return {
    posts: result.rows,
    total: totalCountResult.rows[0].count
  };
};

/**
 * Delete a post
 * @param {number} postId - Post ID
 * @param {number} userId - User ID (for ownership verification)
 * @returns {Promise<boolean>} Success status
 */
const deletePost = async (postId, userId) => {
  const result = await query(
    "UPDATE posts SET is_deleted = false WHERE id = $1 AND user_id = $2",
    [postId, userId],
  );

  return result.rowCount > 0;
};

/**
 * Update a post
 * @param {number} postId - Post ID to update
 * @param {number} userId - User ID (for ownership verification)
 * @param {Object} updates - Post updates
 * @param {string} [updates.content] - New content
 * @param {string} [updates.media_url] - New media URL
 * @param {boolean} [updates.comments_enabled] - New comments enabled status
 * @returns {Promise<boolean>} Success status
 */
const updatePost = async (postId, userId, updates) => {
  try {
    // Verify ownership
    const post = await getPostById(postId);
    if (!post || post.user_id !== userId) {
      return false;
    }

    // Build update query
    const updateColumns = [];
    const values = [];
    let i = 1;

    if (updates.content !== undefined) {
      updateColumns.push(`content = $${i}`);
      values.push(updates.content);
      i++;
    }

    if (updates.media_url !== undefined) {
      updateColumns.push(`media_url = $${i}`);
      values.push(updates.media_url);
      i++;
    }

    if (updates.comments_enabled !== undefined) {
      updateColumns.push(`comments_enabled = $${i}`);
      values.push(updates.comments_enabled);
      i++;
    }

    // Always update updated_at
    updateColumns.push(`updated_at = NOW()`);

    if (updateColumns.length === 0) {
      return false;
    }

    // Add post ID and user ID to values
    values.push(postId, userId);

    const queryText = `
      UPDATE posts 
      SET ${updateColumns.join(', ')}
      WHERE id = $${i} AND user_id = $${i + 1}
      RETURNING id
    `;

    const result = await query(queryText, values);
    return result.rowCount > 0;
  } catch (error) {
    logger.error('Error updating post:', error);
    return false;
  }
};

/**
 * Search posts by content
 * @param {string} query - Search term
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of posts per page
 * @returns {Promise<{posts: Array, total: number}>} Paginated search results and total count
 */
const searchPosts = async (query, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const searchQuery = `%${query}%`;

    // Get posts matching the search query
    const result = await query(
      `SELECT 
          p.*,
          u.username,
          u.full_name,
          COUNT(DISTINCT l.id) as likes_count,
          COUNT(DISTINCT c.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id AND c.is_deleted = false
        WHERE p.content ILIKE $1 
        AND p.is_deleted = false
        GROUP BY p.id, u.id
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3`,
      [searchQuery, limit, offset]
    );

    // Get total count for pagination
    const totalCountResult = await query(
      `SELECT COUNT(*)
      FROM posts p
      WHERE p.content ILIKE $1 
      AND p.is_deleted = false`,
      [searchQuery]
    );

    return {
      posts: result.rows,
      total: totalCountResult.rows[0].count
    };
  } catch (error) {
    logger.error('Error searching posts:', error);
    throw error;
  }
};

module.exports = {
  createPost,
  getPostById,
  getPostsByUserId,
  getFeedPosts,
  deletePost,
  updatePost,
  searchPosts,
};
