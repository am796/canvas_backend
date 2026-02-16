const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Counter = require('../models/Counter');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    console.log('Token decoded:', JSON.stringify(decoded));
    
    // Handle both old tokens with _id and new tokens with id
    let userId = decoded.id;
    
    console.log('Initial userId from token:', userId, 'type:', typeof userId);
    
    // If id is a MongoDB ObjectId string (24 hex chars), find user and get numeric id
    if (typeof userId === 'string' && userId.length === 24) {
      const user = await User.findById(userId);
      if (user) {
        // Assign numeric id if user doesn't have one
        if (!user.id) {
          user.id = await Counter.getNextSequence('userId');
          await user.save();
        }
        userId = user.id;
      }
    }
    
    console.log('Final userId:', userId);
    
    req.user = {
      ...decoded,
      id: userId
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const verifyUser = (req, res, next) => {
  if (req.user.role !== 'user' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'User access required' });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyUser
};
