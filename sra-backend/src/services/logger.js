const { ActivityLog } = require('../models');

const logActivity = async (req, action, module, description, details = {}) => {
  try {
    await ActivityLog.create({
      user: req.user ? req.user._id : null,
      username: req.user ? req.user.username : (req.body.username || 'Anonymous'),
      action,
      module,
      description,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Audit Log Error:', error); // Fail silently to not block main thread
  }
};

module.exports = { logActivity };