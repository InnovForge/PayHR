const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.get('/auth/login', authController.renderLogin);

module.exports = router;
