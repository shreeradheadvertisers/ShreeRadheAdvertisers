const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
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
    enum: ['Pending', 'Partially Paid', 'Paid'], 
    default: 'Pending' 
  },
  paymentMode: { type: String, enum: ['Cash', 'Cheque', 'Online', 'Bank Transfer'] },
  notes: String,
  deleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true });

// --- AUTOMATIC STATUS LOGIC ---
BookingSchema.pre('save', function(next) {
  // 1. If it's a new booking, automatically decide the status based on dates
  // 2. If dates are modified but the user didn't manually change the status dropdown, update it automatically
  if (this.isNew || ((this.isModified('startDate') || this.isModified('endDate')) && !this.isModified('status'))) {
    if (this.status === 'Cancelled') return next();

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (now < start) {
      this.status = 'Upcoming';
    } else if (now >= start && now <= end) {
      this.status = 'Active';
    } else {
      this.status = 'Completed';
    }
  }
  next();
});

// Indexes
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ mediaId: 1 });
BookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', BookingSchema);

// Clean up old ghost index
Booking.collection.dropIndex('bookingId_1').catch(() => {});

module.exports = Booking;