const mongoose = require('mongoose');
const Counter = require('./Counter');

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true,  //indexing ko unique banaya
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user']
  },
  refresh_token: {
    type: String,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment id before saving
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.id = await Counter.getNextSequence('userId');
  }
  next();
});

// Create indexes (id and username already indexed via unique: true)
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
