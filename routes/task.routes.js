const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { verifyToken, verifyUser } = require('../middleware/auth.middleware');

router.get('/', verifyToken, verifyUser, taskController.getTasks);
router.post('/', verifyToken, verifyUser, taskController.createTask);
router.put('/:id', verifyToken, verifyUser, taskController.updateTask);
router.delete('/:id', verifyToken, verifyUser, taskController.deleteTask);

module.exports = router;
