const User = require('../models/User');
const Task = require('../models/Task');
const path = require('path');
const fs = require('fs');

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const filePath = `/storage/profiles/${req.file.filename}`;

    // Get old profile picture path to delete
    const user = await User.findById(userId);
    if (user.profilePicture) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user with new profile picture
    await User.findByIdAndUpdate(userId, { profilePicture: filePath });

    res.json({
      message: 'Profile picture uploaded successfully',
      filePath: filePath
    });
  } catch (err) {
    console.error('Upload profile error:', err);
    res.status(500).json({ error: 'Error uploading profile picture' });
  }
};

// Upload task attachment
const uploadTaskAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { taskId } = req.params;
    const userId = req.user.id;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user owns the task or is admin
    if (task.user_id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: `/storage/attachments/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };

    // Add attachment to task
    await Task.findByIdAndUpdate(taskId, {
      $push: { attachments: attachment }
    });

    res.json({
      message: 'Attachment uploaded successfully',
      attachment: attachment
    });
  } catch (err) {
    console.error('Upload attachment error:', err);
    res.status(500).json({ error: 'Error uploading attachment' });
  }
};

// Delete task attachment
const deleteTaskAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.user_id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete file from storage
    const filePath = path.join(__dirname, '..', attachment.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove attachment from task
    await Task.findByIdAndUpdate(taskId, {
      $pull: { attachments: { _id: attachmentId } }
    });

    res.json({ message: 'Attachment deleted successfully' });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ error: 'Error deleting attachment' });
  }
};

// Delete profile picture
const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.profilePicture) {
      return res.status(400).json({ error: 'No profile picture to delete' });
    }

    // Delete file from storage
    const filePath = path.join(__dirname, '..', user.profilePicture);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove profile picture from user
    await User.findByIdAndUpdate(userId, { profilePicture: null });

    res.json({ message: 'Profile picture deleted successfully' });
  } catch (err) {
    console.error('Delete profile picture error:', err);
    res.status(500).json({ error: 'Error deleting profile picture' });
  }
};

module.exports = {
  uploadProfilePicture,
  uploadTaskAttachment,
  deleteTaskAttachment,
  deleteProfilePicture
};
