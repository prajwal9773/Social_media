const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const scheduledPostsController = require('../controllers/scheduled_posts');

// Create a new scheduled post
router.post('/', authenticateToken, scheduledPostsController.create);

// Get user's scheduled posts
router.get('/', authenticateToken, scheduledPostsController.list);

// Get a specific scheduled post
router.get('/:scheduledPostId', authenticateToken, scheduledPostsController.get);

// Update a scheduled post
router.put('/:scheduledPostId', authenticateToken, scheduledPostsController.update);

// Cancel a scheduled post
router.delete('/:scheduledPostId', authenticateToken, scheduledPostsController.cancel);

// Publish a scheduled post immediately
router.post('/:scheduledPostId/publish', authenticateToken, scheduledPostsController.publish);

module.exports = router;
