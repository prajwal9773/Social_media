// TODO: Implement likes controller
// This controller should handle:
// - Liking posts
// - Unliking posts
// - Getting likes for a post
// - Getting posts liked by a user

const {
    likePost,
    unlikePost,
    getPostLikes,
    getUserLikes,
    hasUserLikedPost,
} = require("../models/like.js");
const logger = require("../utils/logger");

/**
 * Like a post
 */
const like = async (req, res) => {
    try {
        const { post_id } = req.validatedData;
        const userId = req.user.id;

        // Check if user has already liked the post
        const hasLiked = await hasUserLikedPost({
            user_id: userId,
            post_id,
        });

        if (hasLiked) {
            return res.status(400).json({
                error: "Post already liked by user",
            });
        }

        const liked = await likePost({
            user_id: userId,
            post_id,
        });

        if (!liked) {
            return res.status(404).json({
                error: "Post not found",
            });
        }

        logger.verbose(`User ${userId} liked post ${post_id}`);

        res.json({
            message: "Post liked successfully",
        });
    } catch (error) {
        logger.critical("Like post error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Unlike a post
 */
const unlike = async (req, res) => {
    try {
        const { post_id } = req.validatedData;
        const userId = req.user.id;

        // Check if user has liked the post
        const hasLiked = await hasUserLikedPost({
            user_id: userId,
            post_id,
        });

        if (!hasLiked) {
            return res.status(400).json({
                error: "Post not liked by user",
            });
        }

        const unliked = await unlikePost({
            user_id: userId,
            post_id,
        });

        if (!unliked) {
            return res.status(404).json({
                error: "Post not found",
            });
        }

        logger.verbose(`User ${userId} unliked post ${post_id}`);

        res.json({
            message: "Post unliked successfully",
        });
    } catch (error) {
        logger.critical("Unlike post error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get likes for a post
 */
const getPostLikesCtrl = async (req, res) => {
    try {
        const { post_id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const likes = await getPostLikes(parseInt(post_id));
        
        logger.verbose(`Fetching likes for post ${post_id}, page ${page}, limit ${limit}`);

        res.json({
            likes,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: likes.length,
            },
        });
    } catch (error) {
        logger.critical("Get post likes error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get posts liked by a user
 */
const getUserLikesCtrl = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const likes = await getUserLikes(parseInt(user_id));
        
        logger.verbose(`Fetching posts liked by user ${user_id}, page ${page}, limit ${limit}`);

        res.json({
            likes,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: likes.length,
            },
        });
    } catch (error) {
        logger.critical("Get user likes error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    like,
    unlike,
    getPostLikes: getPostLikesCtrl,
    getUserLikes: getUserLikesCtrl,
};
