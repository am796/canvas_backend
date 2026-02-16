const express = require('express');
const router = express.Router();
const { uploadProfile, uploadAttachment } = require('../middleware/upload.middleware');
const {
  uploadProfilePicture,
  uploadTaskAttachment,
  deleteTaskAttachment,
  deleteProfilePicture
} = require('../controllers/upload.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// Profile picture routes
router.post('/profile', uploadProfile.single('profilePicture'), uploadProfilePicture);
router.delete('/profile', deleteProfilePicture);

// Task attachment routes
router.post('/task/:taskId', uploadAttachment.single('attachment'), uploadTaskAttachment);
router.delete('/task/:taskId/:attachmentId', deleteTaskAttachment);

module.exports = router;
