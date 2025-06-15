const { pool } = require("../utils/database");
const logger = require("../utils/logger");

/**
 * Create a new scheduled post
 */
const createScheduledPost = async ({ userId, content, mediaUrl, commentsEnabled, scheduledAt }) => {
  try {
    const result = await pool.query(
      `
        INSERT INTO scheduled_posts (
          user_id, content, media_url, comments_enabled, scheduled_at
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [userId, content, mediaUrl, commentsEnabled, scheduledAt]
    );

    return result.rows[0];
  } catch (error) {
    logger.error("Error creating scheduled post:", error);
    throw error;
  }
};

/**
 * Get all scheduled posts for a user
 */
const getScheduledPosts = async ({ userId, status, page = 1, limit = 10 }) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause = status ? `WHERE status = $2` : '';
    const params = status ? [userId, status] : [userId];

    const result = await pool.query(
      `
        SELECT *, 
               (SELECT COUNT(*) 
                FROM scheduled_posts 
                WHERE user_id = $1 ${status ? 'AND status = $2' : ''}) as total
        FROM scheduled_posts
        WHERE user_id = $1 ${whereClause}
        ORDER BY scheduled_at ASC
        LIMIT $3 OFFSET $4
      `,
      [...params, limit, offset]
    );

    return {
      posts: result.rows,
      total: result.rows[0]?.total || 0
    };
  } catch (error) {
    logger.error("Error getting scheduled posts:", error);
    throw error;
  }
};

/**
 * Get a specific scheduled post
 */
const getScheduledPostById = async (scheduledPostId) => {
  try {
    const result = await pool.query(
      `
        SELECT * FROM scheduled_posts
        WHERE id = $1
      `,
      [scheduledPostId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error("Error getting scheduled post:", error);
    throw error;
  }
};

/**
 * Update a scheduled post
 */
const updateScheduledPost = async ({ scheduledPostId, content, mediaUrl, commentsEnabled, scheduledAt }) => {
  try {
    const result = await pool.query(
      `
        UPDATE scheduled_posts
        SET content = COALESCE($2, content),
            media_url = COALESCE($3, media_url),
            comments_enabled = COALESCE($4, comments_enabled),
            scheduled_at = COALESCE($5, scheduled_at),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [scheduledPostId, content, mediaUrl, commentsEnabled, scheduledAt]
    );

    return result.rows[0];
  } catch (error) {
    logger.error("Error updating scheduled post:", error);
    throw error;
  }
};

/**
 * Cancel a scheduled post
 */
const cancelScheduledPost = async (scheduledPostId) => {
  try {
    const result = await pool.query(
      `
        UPDATE scheduled_posts
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [scheduledPostId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error("Error cancelling scheduled post:", error);
    throw error;
  }
};

/**
 * Publish a scheduled post immediately
 */
const publishScheduledPost = async (scheduledPostId) => {
  try {
    const scheduledPost = await getScheduledPostById(scheduledPostId);
    if (!scheduledPost || scheduledPost.status !== 'pending') {
      throw new Error('Scheduled post not found or not in pending state');
    }

    // Create the actual post
    const postResult = await pool.query(
      `
        INSERT INTO posts (
          user_id, content, media_url, comments_enabled
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        scheduledPost.user_id,
        scheduledPost.content,
        scheduledPost.media_url,
        scheduledPost.comments_enabled
      ]
    );

    // Update scheduled post status
    await pool.query(
      `
        UPDATE scheduled_posts
        SET status = 'posted',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [scheduledPostId]
    );

    return postResult.rows[0];
  } catch (error) {
    logger.error("Error publishing scheduled post:", error);
    throw error;
  }
};

module.exports = {
  createScheduledPost,
  getScheduledPosts,
  getScheduledPostById,
  updateScheduledPost,
  cancelScheduledPost,
  publishScheduledPost
};
