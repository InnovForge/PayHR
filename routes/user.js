const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

router.get('/user/list', userController.renderListUser);

router.get('/user/add', userController.renderCreateUser);

router.get('/user/createdb', userController.renderCreateDB);

router.post('/user/createdb', userController.createDB);

module.exports = router;
