const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/refresh', authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
