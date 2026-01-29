/**
 * Authentication Routes - With Audit Logging & Soft Delete Support
 * UPDATED: Backwards compatibility for legacy users
 */

const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const { authMiddleware, generateToken, JWT_EXPIRES_IN } = require('../middleware/auth');
const { logActivity } = require('../services/logger');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await AdminUser.findOne({ 
      $or: [
        { username: username.toLowerCase() }, 
        { email: username.toLowerCase() }
      ]
    });

    // 1. Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 2. Check if Soft Deleted (Explicit true check)
    if (user.deleted === true) {
      return res.status(401).json({ message: 'Account is deactivated.' });
    }

    // 3. Check if Inactive (Legacy Safe Check)
    // Only block if active is EXPLICITLY false. Undefined (legacy users) are allowed.
    if (user.active === false) {
      return res.status(401).json({ message: 'Account is inactive.' });
    }

    // 4. Validate Password
    if (!user.validatePassword(password)) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // --- SUCCESSFUL LOGIN ---
    
    // Self-Healing: Migrate legacy users by setting defaults if missing
    if (user.active === undefined) user.active = true;
    if (user.deleted === undefined) user.deleted = false;

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    // Attach user to req for logging
    req.user = user; 
    await logActivity(req, 'LOGIN', 'AUTH', `User logged in: ${user.username}`);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin
      },
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.' });
  }
});

// Register (protected by admin secret)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
      return res.status(403).json({ message: 'Invalid registration secret.' });
    }

    if (!username || !email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existingUser = await AdminUser.findOne({
      $or: [
        { username: username.toLowerCase() }, 
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    const user = new AdminUser({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name,
      // Default new users to active
      active: true,
      deleted: false
    });
    user.setPassword(password);
    await user.save();

    const token = generateToken(user);

    req.user = user;
    await logActivity(req, 'CREATE', 'AUTH', `New Admin Registered: ${username}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      },
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// Verify Token
router.get('/verify', authMiddleware, (req, res) => {
  // Check if user was deleted/deactivated *after* token was issued
  if (req.user.deleted || req.user.active === false) {
    return res.status(401).json({ valid: false, message: 'User account invalid.' });
  }

  res.json({
    valid: true,
    user: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      lastLogin: req.user.lastLogin
    }
  });
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  await logActivity(req, 'LOGOUT', 'AUTH', `User logged out: ${req.user.username}`);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Change Password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await AdminUser.findById(req.user._id);
    
    // Safety check
    if (!user || user.deleted) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    if (!user.validatePassword(currentPassword)) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.setPassword(newPassword);
    await user.save();

    await logActivity(req, 'UPDATE', 'AUTH', `Password changed for: ${user.username}`);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password.' });
  }
});

module.exports = router;