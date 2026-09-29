const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.delete('/:commentId', protect, validateObjectId('commentId'), commentController.deleteComment);

module.exports = router;
