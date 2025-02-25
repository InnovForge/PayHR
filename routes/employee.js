const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee');

router.get('/employee/list', employeeController.renderListEmployee);

module.exports = router;
