'use strict';

const express = require('express');
const router = express.Router();
const authController = require(__base + 'app/controllers/auth');

router.route('/auth/login').post(authController.login);
router.route('/auth/register').post(authController.register);
module.exports = router;