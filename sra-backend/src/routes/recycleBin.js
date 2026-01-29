/**
 * Recycle Bin Routes - With Audit Logging
 * Aggregates deleted items from all collections with correct Custom IDs.
 */

const express = require('express');
const router = express.Router();
// Ensure ALL models are imported so we can delete from any of them
const { Media, Booking, Customer, Payment, TaxRecord, Tender } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { logActivity } = require('../services/logger');

// --- HELPER: Generate Custom Booking ID ---
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
  
  const sequence = index >= 0 ? 1000 + index + 1 : "0000";
  return `SRA/${ay}/${sequence}`;
};

// 1. GET ALL DELETED ITEMS
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Calculate global indices for bookings
    const allBookings = await Booking.find({}, { _id: 1, startDate: 1, createdAt: 1 }).lean();
    
    allBookings.sort((a, b) => {
      const timeA = new Date(a.startDate || a.createdAt).getTime();
      const timeB = new Date(b.startDate || b.createdAt).getTime();
      return timeA - timeB;
    });

    const bookingIdMap = {};
    allBookings.forEach((b, index) => {
      bookingIdMap[b._id.toString()] = generateBookingId(b, index);
    });

    // Fetch deleted items from all collections
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
      Tender.find({ deleted: true }).sort({ deletedAt: -1 }),
      TaxRecord.find({ deleted: true }).sort({ deletedAt: -1 })
    ]);

    // Transform Data
    const binItems = [];

    deletedMedia.forEach(m => {
      binItems.push({
        id: m._id,
        type: 'media',
        displayName: m.name || "Unknown Media",
        subText: `${m.city || ''}, ${m.district || ''} (${m.type})`,
        deletedAt: m.deletedAt
      });
    });

    deletedBookings.forEach(b => {
      const customId = bookingIdMap[b._id.toString()] || "Unknown ID";
      const clientName = b.customerId?.company || b.customerId?.name || "Unknown Client";
      
      binItems.push({
        id: b._id,
        type: 'booking',
        displayName: customId,
        subText: `${clientName} • ${b.mediaId?.name || 'Site N/A'}`,
        deletedAt: b.deletedAt
      });
    });

    deletedCustomers.forEach(c => {
      binItems.push({
        id: c._id,
        type: 'customer',
        displayName: c.company || c.name,
        subText: c.group || "No Group",
        deletedAt: c.deletedAt
      });
    });

    deletedTenders.forEach(t => {
      binItems.push({
        id: t._id,
        type: 'agreement',
        displayName: t.tenderNumber || "Tender Agreement",
        subText: t.tenderName,
        deletedAt: t.deletedAt
      });
    });

    deletedTax.forEach(t => {
      binItems.push({
        id: t._id,
        type: 'tax',
        displayName: `Tax: ${t.tenderNumber}`,
        subText: `Amount: ${t.amount}`,
        deletedAt: t.deletedAt
      });
    });

    // Sort by deleted date (newest first)
    binItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.json(binItems);
  } catch (error) {
    console.error('Recycle Bin Error:', error);
    res.status(500).json({ message: 'Failed to fetch recycle bin items' });
  }
});

// 2. RESTORE ITEM
router.post('/restore', authMiddleware, async (req, res) => {
  const { id, type } = req.body;
  try {
    let result;
    if (type === 'media') result = await Media.findByIdAndUpdate(id, { deleted: false, deletedAt: null });
    else if (type === 'booking') result = await Booking.findByIdAndUpdate(id, { deleted: false, deletedAt: null });
    else if (type === 'customer') result = await Customer.findByIdAndUpdate(id, { deleted: false, deletedAt: null });
    else if (type === 'agreement') result = await Tender.findByIdAndUpdate(id, { deleted: false, deletedAt: null });
    else if (type === 'tax') result = await TaxRecord.findByIdAndUpdate(id, { deleted: false, deletedAt: null });

    if (!result) return res.status(404).json({ message: 'Item not found' });

    await logActivity(req, 'UPDATE', 'SYSTEM', `Restored ${type} from Recycle Bin`, { itemId: id });

    res.json({ success: true, message: 'Item restored successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore item' });
  }
});

// 3. PERMANENT DELETE (Fixes 404 Error)
// NOTE: This must be defined BEFORE any generic /:id route if one exists
router.delete('/permanent-delete', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { id, type } = req.query; // Gets params from URL: ?id=...&type=...

    if (!id || !type) {
      return res.status(400).json({ message: "ID and Type are required." });
    }

    let result;
    switch (type.toLowerCase()) {
      case 'media': result = await Media.findByIdAndDelete(id); break;
      case 'booking': result = await Booking.findByIdAndDelete(id); break;
      case 'customer': result = await Customer.findByIdAndDelete(id); break;
      case 'agreement': result = await Tender.findByIdAndDelete(id); break;
      case 'tax': result = await TaxRecord.findByIdAndDelete(id); break;
      default: return res.status(400).json({ message: "Invalid item type" });
    }

    if (!result) return res.status(404).json({ message: 'Item not found or already deleted' });

    await logActivity(req, 'DELETE', 'SYSTEM', `Permanently deleted ${type}`, { itemId: id });

    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (error) {
    console.error("Permanent Delete Error:", error);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

// 4. WIPE RECYCLE BIN (Optional: For "Wipe All" Button)
router.delete('/wipe', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const [mediaRes, bookingRes, customerRes, tenderRes, taxRes] = await Promise.all([
      Media.deleteMany({ deleted: true }),
      Booking.deleteMany({ deleted: true }),
      Customer.deleteMany({ deleted: true }),
      Tender.deleteMany({ deleted: true }),
      TaxRecord.deleteMany({ deleted: true })
    ]);

    const total = mediaRes.deletedCount + bookingRes.deletedCount + customerRes.deletedCount + tenderRes.deletedCount + taxRes.deletedCount;

    await logActivity(req, 'DELETE', 'SYSTEM', `Wiped Recycle Bin (${total} items removed)`);

    res.json({ success: true, message: `Recycle Bin wiped. ${total} items removed permanently.` });
  } catch (error) {
    console.error("Wipe Error:", error);
    res.status(500).json({ message: "Failed to wipe recycle bin" });
  }
});

module.exports = router;