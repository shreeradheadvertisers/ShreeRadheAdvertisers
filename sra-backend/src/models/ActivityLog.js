const mongoose = require('mongoose');
const { logsConnection } = require('../config/database'); // Import the separate connection

const ActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }, // Kept for reference
  
  // SNAPSHOT FIELDS (Required because we cannot populate across DBs)
  username: String, 
  fullName: String, // e.g. "Ashish"
  role: String,     // e.g. "admin"

  action: { 
    type: String, 
    required: true,
    enum: ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'FAILED_LOGIN', 'RESTORE', 'SOFT_DELETE', 'UPLOAD'] 
  },
  module: { 
    type: String, 
    required: true,
    enum: ['AUTH', 'USER', 'BOOKING', 'MEDIA', 'PAYMENT', 'CUSTOMER', 'SYSTEM', 'REPORTS', 'MAINTENANCE', 'CONTACT', 'TENDER', 'COMPLIANCE', 'TAX'] 
  },
  description: { type: String, required: true },
  details: { type: Object }, 
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

// 👇 CRITICAL: Use logsConnection.model instead of mongoose.model
module.exports = logsConnection.model('ActivityLog', ActivityLogSchema);