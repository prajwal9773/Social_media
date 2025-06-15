// TODO: Implement users controller
// This controller should handle:
// - Following a user
// - Unfollowing a user
// - Getting users that the current user is following
// - Getting users that follow the current user
// - Getting follow counts for a user

const {
    followUser,
    unfollowUser,
    getFollowing,
    getFollowers,
    getFollowCounts,
} = require("../models/follow.js");
const logger = require("../utils/logger");

/**
 * Follow a user
 */
const follow = async (req, res) => {
    try {
        const { following_id } = req.validatedData;
        const follower_id = req.user.id;

        // Check if user is trying to follow themselves
        if (follower_id === parseInt(following_id)) {
            return res.status(400).json({
                error: "Cannot follow yourself",
            });
        }

        // Check if already following
        const existingFollow = await getFollowing(follower_id).then(follows => 
            follows.some(follow => follow.following_id === parseInt(following_id))
        );

        if (existingFollow) {
            return res.status(400).json({
                error: "Already following this user",
            });
        }

        const followed = await followUser({
            follower_id,
            following_id: parseInt(following_id),
        });

        if (!followed) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        logger.verbose(`User ${follower_id} followed user ${following_id}`);

        res.json({
            message: "User followed successfully",
        });
    } catch (error) {
        logger.critical("Follow user error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Unfollow a user
 */
const unfollow = async (req, res) => {
    try {
        const { following_id } = req.validatedData;
        const follower_id = req.user.id;

        // Check if user is trying to unfollow themselves
        if (follower_id === parseInt(following_id)) {
            return res.status(400).json({
                error: "Cannot unfollow yourself",
            });
        }

        // Check if not following
        const existingFollow = await getFollowing(follower_id).then(follows => 
            follows.some(follow => follow.following_id === parseInt(following_id))
        );

        if (!existingFollow) {
            return res.status(400).json({
                error: "Not following this user",
            });
        }

        const unfollowed = await unfollowUser({
            follower_id,
            following_id: parseInt(following_id),
        });

        if (!unfollowed) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        logger.verbose(`User ${follower_id} unfollowed user ${following_id}`);

        res.json({
            message: "User unfollowed successfully",
        });
    } catch (error) {
        logger.critical("Unfollow user error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get users that the current user is following
 */
const getMyFollowing = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const following = await getFollowing(userId);
        
        logger.verbose(`Fetching following users for user ${userId}, page ${page}, limit ${limit}`);

        res.json({
            following,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: following.length,
            },
        });
    } catch (error) {
        logger.critical("Get following error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get users that follow the current user
 */
const getMyFollowers = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const followers = await getFollowers(userId);
        
        logger.verbose(`Fetching followers for user ${userId}, page ${page}, limit ${limit}`);

        res.json({
            followers,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: followers.length,
            },
        });
    } catch (error) {
        logger.critical("Get followers error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get follow counts for a user
 */
const getFollowCountsCtrl = async (req, res) => {
    try {
        const userId = req.user.id;
        const followCounts = await getFollowCounts(userId);
        
        logger.verbose(`Fetching follow counts for user ${userId}`);

        res.json({
            following_count: followCounts.following_count,
            followers_count: followCounts.followers_count,
        });
    } catch (error) {
        logger.critical("Get follow counts error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    follow,
    unfollow,
    getMyFollowing,
    getMyFollowers,
    getFollowCounts: getFollowCountsCtrl,
};
