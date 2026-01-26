/**
 * Booking Schema
 */

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  mediaId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Media', 
    required: true 
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Upcoming', 'Completed', 'Cancelled'], 
    default: 'Upcoming' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Partially Paid', 'Paid', 'Cancelled'], 
    default: 'Pending' 
  },
  paymentMode: { 
    type: String, 
    enum: ['Cash', 'Cheque', 'Online', 'Bank Transfer'] 
  },
  notes: String,
  deleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true });

// --- AUTOMATIC STATUS LOGIC ---
// This runs every time a booking is created or updated
BookingSchema.pre('save', function(next) {
  // 1. If status is manually set to 'Cancelled' or 'Completed', do not overwrite
  if (this.status === 'Cancelled' || this.status === 'Completed') return next();

  // 2. Automatically decide status based on dates for new bookings or date modifications
  if (this.isNew || this.isModified('startDate') || this.isModified('endDate')) {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to midnight

    const start = new Date(this.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(this.endDate);
    end.setHours(0, 0, 0, 0);

    if (now < start) {
      this.status = 'Upcoming';
    } else if (now >= start && now <= end) {
      this.status = 'Active';
    } else if (now > end) {
      this.status = 'Completed';
    }
  }

  next();
});

// Indexes
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ mediaId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ deleted: 1 });

const Booking = mongoose.model('Booking', BookingSchema);

// Run the fix for stale indexes
Booking.collection.dropIndex('bookingId_1').catch(err => {
  if (err.code !== 27) {
    console.log("Note: Checked for stale 'bookingId' index:", err.message);
  }
});

module.exports = Booking;