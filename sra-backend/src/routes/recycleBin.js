/**
 * Recycle Bin Routes
 * Aggregates deleted items from all collections with correct Custom IDs.
 */

const express = require('express');
const router = express.Router();
// FIX: Changed 'TenderAgreement' to 'Tender' to match models/index.js
const { Media, Booking, Customer, Payment, TaxRecord, Tender } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// --- HELPER: Generate Custom Booking ID ---
// We must define this here because the Backend cannot import from Frontend 'lib/utils.ts'
const generateBookingId = (booking, index) => {
  if (!booking) return "N/A";
  
  const dateSource = booking.startDate || booking.createdAt;
  let ay = "0000";
  
  if (dateSource) {
      const d = new Date(dateSource);
      if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = d.getMonth();
          // Financial Year Logic (Apr-Mar)
          let startYear = (month < 3) ? year - 1 : year;
          let endYear = startYear + 1;
          ay = `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`;
      }
  }
  
  // Sequence starts at 1001 (index 0 -> 1001)
  const sequence = index >= 0 ? 1000 + index + 1 : "0000";
  return `SRA/${ay}/${sequence}`;
};

// Get all deleted items (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 1. CALCULATE GLOBAL INDICES
    // Fetch ALL bookings (active + deleted) to determine the correct sequence number (1001, 1002...)
    const allBookings = await Booking.find({}, { _id: 1, startDate: 1, createdAt: 1 }).lean();
    
    // Sort exactly like frontend: Start Date -> Created At
    allBookings.sort((a, b) => {
      const timeA = new Date(a.startDate || a.createdAt).getTime();
      const timeB = new Date(b.startDate || b.createdAt).getTime();
      return timeA - timeB;
    });

    // Create a map: BookingID -> Correct Custom ID (e.g. "SRA/2425/1042")
    const bookingIdMap = {};
    allBookings.forEach((b, index) => {
      bookingIdMap[b._id.toString()] = generateBookingId(b, index);
    });

    // 2. FETCH DELETED ITEMS
    const [
      deletedMedia, 
      deletedBookings, 
      deletedCustomers,
      deletedTenders,
      deletedTax
    ] = await Promise.all([
      Media.find({ deleted: true }).sort({ deletedAt: -1 }),
      Booking.find({ deleted: true })
        .populate('mediaId', 'name')
        .populate('customerId', 'company name')
        .sort({ deletedAt: -1 }),
      Customer.find({ deleted: true }).sort({ deletedAt: -1 }),
      // FIX: Use 'Tender' model
      Tender.find({ deleted: true }).sort({ deletedAt: -1 }),
      TaxRecord.find({ deleted: true }).sort({ deletedAt: -1 })
    ]);

    // 3. TRANSFORM & FORMAT
    const binItems = [];

    // -- Media --
    deletedMedia.forEach(m => {
      binItems.push({
        id: m._id,
        type: 'media',
        displayName: m.name || "Unknown Media",
        subText: `${m.city || ''}, ${m.district || ''} (${m.type})`,
        deletedAt: m.deletedAt
      });
    });

    // -- Bookings --
    deletedBookings.forEach(b => {
      // Use the pre-calculated Map to get the correct "SRA/..." ID
      const customId = bookingIdMap[b._id.toString()] || "Unknown ID";
      const clientName = b.customerId?.company || b.customerId?.name || "Unknown Client";
      
      binItems.push({
        id: b._id,
        type: 'booking',
        displayName: customId, // Correctly formatted ID
        subText: `${clientName} • ${b.mediaId?.name || 'Site N/A'}`,
        deletedAt: b.deletedAt
      });
    });

    // -- Customers --
    deletedCustomers.forEach(c => {
      binItems.push({
        id: c._id,
        type: 'customer',
        displayName: c.company || c.name,
        subText: c.group || "No Group",
        deletedAt: c.deletedAt
      });
    });

    // -- Tenders --
    deletedTenders.forEach(t => {
      binItems.push({
        id: t._id,
        type: 'agreement',
        displayName: t.tenderNumber || "Tender Agreement",
        subText: t.tenderName,
        deletedAt: t.deletedAt
      });
    });

    // -- Tax --
    deletedTax.forEach(t => {
      binItems.push({
        id: t._id,
        type: 'tax',
        displayName: `Tax: ${t.tenderNumber}`,
        subText: `Amount: ${t.amount}`,
        deletedAt: t.deletedAt
      });
    });

    // Sort combined list by deletedAt (most recent first)
    binItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.json(binItems);
  } catch (error) {
    console.error('Recycle Bin Error:', error);
    res.status(500).json({ message: 'Failed to fetch recycle bin items' });
  }
});

// Restore item (protected)
router.post('/restore', authMiddleware, async (req, res) => {
  const { id, type } = req.body;
  try {
    let result;
    if (type === 'media') {
      result = await Media.findByIdAndUpdate(id, { deleted: false, deletedAt: null });
    } else if (type === 'booking') {
      result = await Booking.findByIdAndUpdate(id, { deleted: false, deletedAt: null });
    } else if (type === 'customer') {
      result = await Customer.findByIdAndUpdate(id, { deleted: false, deletedAt: null });
    } else if (type === 'agreement') {
      // FIX: Use 'Tender' model
      result = await Tender.findByIdAndUpdate(id, { deleted: false, deletedAt: null });
    } else if (type === 'tax') {
      result = await TaxRecord.findByIdAndUpdate(id, { deleted: false, deletedAt: null });
    }

    if (!result) return res.status(404).json({ message: 'Item not found' });
    res.json({ success: true, message: 'Item restored successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore item' });
  }
});

// Permanent delete (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { type } = req.query; // pass type as query param
  const { id } = req.params;

  try {
    let result;
    if (type === 'media') result = await Media.findByIdAndDelete(id);
    else if (type === 'booking') result = await Booking.findByIdAndDelete(id);
    else if (type === 'customer') result = await Customer.findByIdAndDelete(id);
    // FIX: Use 'Tender' model
    else if (type === 'agreement') result = await Tender.findByIdAndDelete(id);
    else if (type === 'tax') result = await TaxRecord.findByIdAndDelete(id);

    if (!result) return res.status(404).json({ message: 'Item not found' });
    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

module.exports = router;