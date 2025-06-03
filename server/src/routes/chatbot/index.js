const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/authentication.js');
const chatbotController = require('../../controllers/chatbot');

// Route để chat với bot, yêu cầu xác thực
router.post('/converse', auth, chatbotController.converse);

module.exports = router; 