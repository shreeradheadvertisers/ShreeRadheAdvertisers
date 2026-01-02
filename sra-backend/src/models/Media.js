/**
 * Media Schema - Outdoor Advertising Media Locations
 */
const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  // Custom SRA IDs (e.g., SRA-RPR-001)
  id: { 
    type: String, 
    required: true, 
    unique: true 
  },
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
  status: { 
    type: String, 
    enum: ['Available', 'Booked', 'Coming Soon', 'Maintenance'], 
    default: 'Available' 
  },
  pricePerMonth: { type: Number, required: true },
  
  // Stores the public URL returned by the FTP bridge to your Hostinger SSD.
  // This is critical for connecting your MongoDB JSON data to the heavy images on Hostinger
  imageUrl: { type: String }, 

  deleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true });

// Ensure virtuals are handled correctly
MediaSchema.set('toJSON', { virtuals: false });

// Indexes for performance
MediaSchema.index({ state: 1, district: 1, city: 1 });
MediaSchema.index({ status: 1 });
MediaSchema.index({ type: 1 });
MediaSchema.index({ deleted: 1 });

module.exports = mongoose.model('Media', MediaSchema);