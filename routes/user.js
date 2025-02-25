const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

router.get('/user/list', userController.renderListUser);

router.get('/user/add', userController.renderCreateUser);

module.exports = router;
