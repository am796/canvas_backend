const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

router.get('/', verifyToken, verifyAdmin, userController.getAllUsers);
router.post('/', verifyToken, verifyAdmin, userController.createUser);
router.delete('/:id', verifyToken, verifyAdmin, userController.deleteUser);

module.exports = router;
