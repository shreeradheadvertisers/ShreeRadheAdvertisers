const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { logActivity } = require('../services/logger');

// Middleware: Strictly Admin Only
router.use(authMiddleware, requireRole('admin', 'superadmin'));

// 1. GET USERS (Updated with Filter for Restoration)
// Usage: GET /?status=active (default) | ?status=deleted | ?status=all
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status === 'deleted') {
      // Show only deactivated users
      query.deleted = true;
    } else if (status === 'all') {
      // Show everyone
    } else {
      // Default: Hide deactivated users
      query.deleted = { $ne: true };
    }

    const users = await AdminUser.find(query)
      .select('-passwordHash -salt')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// 2. CREATE USER
router.post('/', async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;
    
    // Check existing (including deleted ones to avoid email collision)
    const existing = await AdminUser.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = new AdminUser({ username, email, name, role });
    user.setPassword(password);
    await user.save();

    await logActivity(req, 'CREATE', 'USER', `Created user: ${username} (${role})`, {
      targetUserId: user._id,
      name: user.name
    });
    
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

    if (!user) return res.status(404).json({ message: 'User not found' });

    await logActivity(req, 'UPDATE', 'USER', `Updated user: ${user.username}`, { 
      targetUserId: user._id,
      name: user.name,
      changes: req.body 
    });
    
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

    await logActivity(req, 'UPDATE', 'USER', `Reset password for: ${user.username}`, {
      targetUserId: user._id,
      name: user.name
    });
    
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// 5. DELETE USER (Soft Delete)
router.delete('/:id', async (req, res) => {
  try {
    // Prevent suicide (Deleting own account)
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    const user = await AdminUser.findByIdAndUpdate(
      req.params.id,
      { 
        deleted: true, 
        active: false,
        deletedAt: new Date()
      },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    await logActivity(req, 'DELETE', 'USER', `Deactivated user: ${user.username}`, {
      targetUserId: user._id,
      name: user.name,
      role: user.role
    });
    
    res.json({ success: true, message: 'User account deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// 6. RESTORE USER (New Route)
router.patch('/:id/restore', async (req, res) => {
  try {
    const user = await AdminUser.findByIdAndUpdate(
      req.params.id,
      { 
        deleted: false, 
        active: true, 
        deletedAt: null 
      }, 
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    await logActivity(req, 'UPDATE', 'USER', `Reactivated user: ${user.username}`, {
      targetUserId: user._id,
      name: user.name
    });

    res.json({ success: true, message: 'User account reactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore user' });
  }
});

module.exports = router;