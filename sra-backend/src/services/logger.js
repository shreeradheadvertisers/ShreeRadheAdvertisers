const { ActivityLog } = require('../models');

const logActivity = async (req, action, module, description, details = {}) => {
  try {
    // 1. Determine User Details safely (Snapshotting)
    // We snapshot these because Logs DB cannot "join" with Main DB users
    const userId = req.user ? req.user._id : null;
    const username = req.user ? req.user.username : (req.body.username || 'Anonymous');
    const fullName = req.user ? req.user.name : 'System'; // Default to 'System' if no user
    const role = req.user ? req.user.role : 'System';

    // 2. Create Log Entry in the "Whale" Database
    await ActivityLog.create({
      user: userId,
      username,
      fullName, // New Snapshot Field
      role,     // New Snapshot Field
      
      action,
      module,
      description,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    // Fail silently to not block the main thread (User experience comes first)
    console.error('Audit Log Error:', error.message); 
  }
};

module.exports = { logActivity };