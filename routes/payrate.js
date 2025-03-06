const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/payrate');

router.get('/payrate/list', employeeController.renderListPayrate);

module.exports = router;
