const express = require('express');
const router = express.Router();
const userController = require('../controllers/manage');

router.get('/manage', userController.renderManage);

router.get('/api/v1/employees', userController.getAllEmployees);

router.get('/manage/e/:id', userController.getEmployeeById);
router.delete('/api/v1/employees/:id', userController.deleteEmployeeById);
router.post('/api/v1/employees/:id', userController.updateEmployeeById);

module.exports = router;
