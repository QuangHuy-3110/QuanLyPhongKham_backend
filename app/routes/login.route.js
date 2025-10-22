const express = require('express');
const auth = require('../controllers/login.controller');

const router = express.Router();

router.route('/login')
    .post(auth.login);

router.route('/forgot-password')
    .post(auth.forgotPassword);

module.exports = router;