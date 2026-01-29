const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { logActivity } = require('../services/logger');

// Middleware: Strictly Admin Only
router.use(authMiddleware, requireRole('admin', 'superadmin'));

// 1. GET ALL USERS
router.get('/', async (req, res) => {
  try {
    const users = await AdminUser.find().select('-passwordHash -salt').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// 2. CREATE USER
router.post('/', async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;
    
    const existing = await AdminUser.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = new AdminUser({ username, email, name, role });
    user.setPassword(password);
    await user.save();

    await logActivity(req, 'CREATE', 'USER', `Created user: ${username} (${role})`);
    
    res.status(201).json({ success: true, user: { _id: user._id, username, role } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// 3. UPDATE USER (Name/Role)
router.put('/:id', async (req, res) => {
  try {
    const { name, role, active } = req.body;
    const user = await AdminUser.findByIdAndUpdate(
      req.params.id, 
      { name, role, active }, 
      { new: true }
    ).select('-passwordHash -salt');

    await logActivity(req, 'UPDATE', 'USER', `Updated user: ${user.username}`, { changes: req.body });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// 4. CHANGE PASSWORD (Admin Reset)
router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await AdminUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.setPassword(password);
    await user.save();

    await logActivity(req, 'UPDATE', 'USER', `Reset password for: ${user.username}`);
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// 5. DELETE USER
router.delete('/:id', async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    const user = await AdminUser.findByIdAndDelete(req.params.id);
    await logActivity(req, 'DELETE', 'USER', `Deleted user: ${user?.username}`);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;