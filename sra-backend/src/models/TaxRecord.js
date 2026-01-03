/**
 * Tax Record Schema - Tax Payment Tracking
 */
const mongoose = require('mongoose');

const TaxRecordSchema = new mongoose.Schema({
  tenderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tender', 
    required: true 
  },
  tenderNumber: { type: String, required: true }, // Denormalized for quick reference
  district: String,
  area: String,
  dueDate: { type: Date, required: true },
  paymentDate: Date,
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Paid', 'Pending', 'Overdue'], 
    default: 'Pending' 
  },
  // receiptUrl: Stores the Cloudinary link to the proof of payment.
  receiptUrl: { type: String },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true });

// Indexes for high-performance filtering
TaxRecordSchema.index({ tenderId: 1 });
TaxRecordSchema.index({ status: 1 });
TaxRecordSchema.index({ dueDate: 1 });
TaxRecordSchema.index({ deleted: 1 });
TaxRecordSchema.index({ tenderNumber: 1 });

module.exports = mongoose.model('TaxRecord', TaxRecordSchema);