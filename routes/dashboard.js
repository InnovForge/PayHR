const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');

router.get('/dashboard', dashboardController.renderDashboard);

module.exports = router;
