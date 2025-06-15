const {
  createScheduledPost,
  getScheduledPosts,
  getScheduledPostById,
  updateScheduledPost,
  cancelScheduledPost,
  publishScheduledPost
} = require("../models/scheduled_post");
const logger = require("../utils/logger");

/**
 * Create a new scheduled post
 */
const create = async (req, res) => {
  try {
    const { content, mediaUrl, commentsEnabled, scheduledAt } = req.body;
    
    if (!content || !scheduledAt) {
      return res.status(400).json({
        error: "Validation error",
        message: "content and scheduledAt are required"
      });
    }

    const scheduledPost = await createScheduledPost({
      userId: req.user.id,
      content,
      mediaUrl,
      commentsEnabled: commentsEnabled ?? true,
      scheduledAt: new Date(scheduledAt)
    });

    res.status(201).json(scheduledPost);
  } catch (error) {
    logger.error("Error creating scheduled post:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};

/**
 * Get user's scheduled posts
 */
const list = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const result = await getScheduledPosts({
      userId: req.user.id,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(result);
  } catch (error) {
    logger.error("Error getting scheduled posts:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};

/**
 * Get a specific scheduled post
 */
const get = async (req, res) => {
  try {
    const { scheduledPostId } = req.params;
    const scheduledPost = await getScheduledPostById(scheduledPostId);

    if (!scheduledPost || scheduledPost.user_id !== req.user.id) {
      return res.status(404).json({
        error: "Not found",
        message: "Scheduled post not found or not owned by user"
      });
    }

    res.json(scheduledPost);
  } catch (error) {
    logger.error("Error getting scheduled post:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};

/**
 * Update a scheduled post
 */
const update = async (req, res) => {
  try {
    const { scheduledPostId } = req.params;
    const { content, mediaUrl, commentsEnabled, scheduledAt } = req.body;

    const scheduledPost = await getScheduledPostById(scheduledPostId);
    if (!scheduledPost || scheduledPost.user_id !== req.user.id) {
      return res.status(404).json({
        error: "Not found",
        message: "Scheduled post not found or not owned by user"
      });
    }

    const updatedPost = await updateScheduledPost({
      scheduledPostId,
      content,
      mediaUrl,
      commentsEnabled,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });

    res.json(updatedPost);
  } catch (error) {
    logger.error("Error updating scheduled post:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};

/**
 * Cancel a scheduled post
 */
const cancel = async (req, res) => {
  try {
    const { scheduledPostId } = req.params;
    const scheduledPost = await getScheduledPostById(scheduledPostId);

    if (!scheduledPost || scheduledPost.user_id !== req.user.id) {
      return res.status(404).json({
        error: "Not found",
        message: "Scheduled post not found or not owned by user"
      });
    }

    const cancelledPost = await cancelScheduledPost(scheduledPostId);
    res.json({
      message: "Scheduled post cancelled successfully",
      post: cancelledPost
    });
  } catch (error) {
    logger.error("Error cancelling scheduled post:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};

/**
 * Publish a scheduled post immediately
 */
const publish = async (req, res) => {
  try {
    const { scheduledPostId } = req.params;
    const scheduledPost = await getScheduledPostById(scheduledPostId);

    if (!scheduledPost || scheduledPost.user_id !== req.user.id) {
      return res.status(404).json({
        error: "Not found",
        message: "Scheduled post not found or not owned by user"
      });
    }

    const post = await publishScheduledPost(scheduledPostId);
    res.json({
      message: "Post published successfully",
      post
    });
  } catch (error) {
    logger.error("Error publishing scheduled post:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};

module.exports = {
  create,
  list,
  get,
  update,
  cancel,
  publish
};
