const { publishScheduledPost } = require('../models/scheduled_post');
const logger = require('../utils/logger');

/**
 * Publish all scheduled posts that are due
 */
const publishDueScheduledPosts = async () => {
  try {
    // Get all pending scheduled posts that are due
    const { query } = require('../utils/database');
    const result = await query(
      `
        SELECT id FROM scheduled_posts
        WHERE status = 'pending'
        AND scheduled_at <= CURRENT_TIMESTAMP
      `
    );

    const scheduledPosts = result.rows;
    
    for (const post of scheduledPosts) {
      try {
        await publishScheduledPost(post.id);
        logger.info(`Published scheduled post ${post.id}`);
      } catch (error) {
        logger.error(`Error publishing scheduled post ${post.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in publishDueScheduledPosts job:', error);
  }
};

module.exports = {
  publishDueScheduledPosts
};
