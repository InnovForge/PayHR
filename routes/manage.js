const express = require('express');
const router = express.Router();
const userController = require('../controllers/manage');

router.get('/manage', userController.renderManage);

module.exports = router;
