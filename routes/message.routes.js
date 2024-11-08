const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/', authMiddleware, messageController.sendMessage);
router.get('/user/messages', authMiddleware, messageController.getUserMessages);
router.get('/admin/messages', authMiddleware, messageController.getAllMessages);

module.exports = router;
