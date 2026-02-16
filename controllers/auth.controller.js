const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Counter = require('../models/Counter');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If user doesn't have a numeric id, assign one
    if (!user.id) {
      user.id = await Counter.getNextSequence('userId');
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    await User.findOneAndUpdate({ id: user.id }, { refresh_token: refreshToken });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      const dbUser = await User.findOne({ id: decoded.id, refresh_token: refreshToken });

      if (!dbUser) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      const accessToken = generateAccessToken(dbUser);
      res.json({ accessToken });
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findOneAndUpdate({ id: userId }, { refresh_token: null });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Error logging out' });
  }
};

const signup = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with 'user' role
    const newUser = new User({
      username,
      password: hashedPassword,
      email: email || undefined,
      role: 'user'
    });

    await newUser.save();

    res.status(201).json({
      message: 'Registration successful! Please login.',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Error creating account' });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  signup
};
