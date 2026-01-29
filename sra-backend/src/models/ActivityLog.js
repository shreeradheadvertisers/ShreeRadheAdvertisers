const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }, // Null if login failed
  username: String, // Store snapshot in case user is deleted
  action: { 
    type: String, 
    required: true,
    enum: ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'FAILED_LOGIN'] 
  },
  module: { 
    type: String, 
    required: true,
    enum: ['AUTH', 'USER', 'BOOKING', 'MEDIA', 'PAYMENT', 'CUSTOMER', 'SYSTEM', 'REPORTS'] 
  },
  description: { type: String, required: true },
  details: { type: Object }, // Flexible bucket for IDs, diffs
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);