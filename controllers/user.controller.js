const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');

const getAllUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { role: 'user' };

    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('id username role created_at')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Transform users to match expected format
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      role
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error creating user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ id: parseInt(id) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    // Delete user's tasks first
    await Task.deleteMany({ user_id: parseInt(id) });

    // Delete user
    await User.deleteOne({ id: parseInt(id) });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Error deleting user' });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  deleteUser
};
