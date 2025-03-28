const express = require('express');
const router = express.Router();
const userController = require('../controllers/manage');

router.get('/manage', userController.renderManage);

router.get('/api/v1/employees', userController.getAllEmployees);

module.exports = router;
