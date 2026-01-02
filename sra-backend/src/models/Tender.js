/**
 * Tender/Agreement Schema - Compliance Management
 */
const mongoose = require('mongoose');

const TenderSchema = new mongoose.Schema({
  tenderName: { type: String, required: true },
  tenderNumber: { type: String, required: true, unique: true },
  district: { type: String, required: true },
  area: String,
  mediaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  taxFrequency: { 
    type: String, 
    enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-Time'] 
  },
  licenseFee: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Active', 'Expiring Soon', 'Expired'], 
    default: 'Active' 
  },

  // documentUrl: Stores the public link to the Tender PDF on Hostinger SSD.
  // This is populated from the response of /api/upload.
  documentUrl: { type: String },
  deleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true });

// Indexes for optimized searching
TenderSchema.index({ district: 1 });
TenderSchema.index({ status: 1 });
TenderSchema.index({ endDate: 1 });
TenderSchema.index({ deleted: 1 });

module.exports = mongoose.model('Tender', TenderSchema);