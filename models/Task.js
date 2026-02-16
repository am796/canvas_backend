const mongoose = require('mongoose');
const Counter = require('./Counter');

// Attachment sub-schema
const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  attachments: [attachmentSchema]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment id before saving
taskSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.id = await Counter.getNextSequence('taskId');
  }
  next();
});

// Create indexes (id already indexed via unique: true)
taskSchema.index({ user_id: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
