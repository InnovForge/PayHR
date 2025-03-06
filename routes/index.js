const express = require('express');
const router = express.Router();
const dashboard = require('./dashboard');
const employee = require('./employee');
const payrate = require('./payrate');
const auth = require('./auth');
const user = require('./user');
const manage = require('./manage');

router.use('/', dashboard);
router.use('/', employee);
router.use('/', user);
router.use('/', payrate);
router.use('/', auth);
router.use('/', manage);

module.exports = router;
