/**
 * Media Schema - Outdoor Advertising Media Locations
 */
const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Unipole', 'Hoarding', 'Gantry', 'Kiosk', 'Digital LED'], 
    required: true 
  },
  state: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  address: String,
  
  // ADD THESE FIELDS TO FIX MISSING DATA IN UI
  size: { type: String, default: "" },
  lighting: { 
    type: String, 
    enum: ['Front Lit', 'Back Lit', 'Non-Lit', 'Digital'], 
    default: 'Non-Lit' 
  },
  facing: { type: String, default: "" },
  landmark: String,
  
  status: { 
    type: String, 
    enum: ['Available', 'Booked', 'Coming Soon', 'Maintenance'], 
    default: 'Available' 
  },
  pricePerMonth: { type: Number, required: true },
  imageUrl: { type: String }, // FTP Bridge URL

  // Metrics for Sidebar
  occupancyRate: { type: Number, default: 0 },
  totalDaysBooked: { type: Number, default: 0 },

  deleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true });

MediaSchema.set('toJSON', { virtuals: false });
MediaSchema.index({ state: 1, district: 1, city: 1 });
MediaSchema.index({ status: 1 });
MediaSchema.index({ type: 1 });
MediaSchema.index({ deleted: 1 });

module.exports = mongoose.model('Media', MediaSchema);