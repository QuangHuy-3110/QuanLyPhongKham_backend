const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller'); // Import Controller

// Định tuyến API gửi email
router.post('/send', emailController.sendEmailController);

module.exports = router;
