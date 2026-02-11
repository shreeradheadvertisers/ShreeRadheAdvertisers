/**
 * Booking Routes - Concurrency Safe Edition
 */

const express = require('express');
const router = express.Router();
const { Booking, Customer, Media } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('../services/logger');

// Helper: Resolve Custom ID to ObjectId
const resolveId = async (Model, id) => {
  if (!id) return null;
  if (id.match(/^[0-9a-fA-F]{24}$/)) return id;
  const doc = await Model.findOne({ id: id });
  return doc ? doc._id : null;
};

// --- HELPER: CONCURRENCY CHECK (Double Booking) ---
const checkForOverlap = async (mediaId, startDate, endDate, excludeBookingId = null) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const query = {
    mediaId: mediaId,
    deleted: false,
    status: { $ne: 'Cancelled' }, // Cancelled bookings don't block availability
    $or: [
      // Check if New Date Range overlaps with any existing range
      { startDate: { $lte: end }, endDate: { $gte: start } }
    ]
  };

  // When updating, don't count the current booking as a conflict
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(query);
  return conflict;
};

// --- SYNC MEDIA STATUS (Based on Booking Status) ---
const syncMediaStatus = async (mediaId) => {
  try {
    if (!mediaId) return;

    // 1. Find ANY booking that is explicitly marked 'Active'
    const activeBooking = await Booking.findOne({
      mediaId: mediaId,
      deleted: false,
      status: 'Active' 
    });

    const media = await Media.findById(mediaId);
    if (!media) return;

    if (activeBooking) {
      if (media.status !== 'Booked') {
        console.log(`[Sync] Locking Media ${mediaId}`);
        await Media.findByIdAndUpdate(mediaId, { status: 'Booked' });
      }
    } else {
      // If NO Active booking exists, revert to Available 
      // (Only if it was 'Booked', preserving 'Maintenance'/'Coming Soon')
      if (media.status === 'Booked') {
        console.log(`[Sync] Freeing Media ${mediaId}`);
        await Media.findByIdAndUpdate(mediaId, { status: 'Available' });
      }
    }
  } catch (error) {
    console.error("Error syncing media status:", error);
  }
};

// Get all bookings
router.get('/', authMiddleware, async (req, res) => {
  try {
    let { customerId, mediaId, status, paymentStatus, page = 1, limit = 50 } = req.query;
    
    const filter = { deleted: false };

    // FIX: Handle Invalid Customer ID -> Return Empty
    // Previously, if ID was invalid, it was ignored, returning ALL bookings.
    if (customerId) {
      const resolvedCustId = await resolveId(Customer, customerId);
      if (resolvedCustId) {
        filter.customerId = resolvedCustId;
      } else {
        // ID provided but not found = No matches possible
        return res.json({ data: [], total: 0, page: parseInt(page), pages: 0 });
      }
    }

    // FIX: Handle Invalid Media ID -> Return Empty
    if (mediaId) {
      const resolvedMediaId = await resolveId(Media, mediaId);
      if (resolvedMediaId) {
        filter.mediaId = resolvedMediaId;
      } else {
        // ID provided but not found = No matches possible
        return res.json({ data: [], total: 0, page: parseInt(page), pages: 0 });
      }
    }

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('mediaId')
        .populate('customerId')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Booking.countDocuments(filter)
    ]);

    res.json({ data: bookings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get single booking
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('mediaId')
      .populate('customerId');
    if (!booking || booking.deleted) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

// Get customer bookings
router.get('/customer/:customerId', authMiddleware, async (req, res) => {
  try {
    const resolvedCustId = await resolveId(Customer, req.params.customerId);
    
    if (!resolvedCustId) {
       return res.json({ data: [], total: 0, page: 1, pages: 1 });
    }

    const bookings = await Booking.find({ 
      customerId: resolvedCustId, 
      deleted: false 
    })
      .populate('mediaId')
      .sort({ createdAt: -1 });
    
    res.json({ data: bookings, total: bookings.length, page: 1, pages: 1 });
  } catch (error) {
    console.error("Fetch customer bookings error:", error);
    res.status(500).json({ message: 'Failed to fetch customer bookings' });
  }
});

// Create booking (With Overlap Check)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log("Received Booking Payload:", req.body); 

    let { mediaId, customerId, startDate, endDate, ...bookingData } = req.body;

    const resolvedMediaId = await resolveId(Media, mediaId);
    if (!resolvedMediaId) return res.status(404).json({ message: `Media not found` });
    
    const resolvedCustId = await resolveId(Customer, customerId);
    const finalCustId = resolvedCustId || (customerId.match(/^[0-9a-fA-F]{24}$/) ? customerId : null);
    
    if (!finalCustId) return res.status(404).json({ message: `Customer not found` });

    // 👇 CONCURRENCY CHECK: Prevent Double Booking
    if (startDate && endDate) {
      const conflict = await checkForOverlap(resolvedMediaId, startDate, endDate);
      if (conflict) {
        return res.status(409).json({ 
          message: 'Double Booking Detected! This media is already booked for these dates.',
          conflictId: conflict._id
        });
      }
    }

    // Default status if missing
    if (!bookingData.status) bookingData.status = 'Upcoming';

    const booking = new Booking({
      ...bookingData,
      startDate,
      endDate,
      mediaId: resolvedMediaId,
      customerId: finalCustId,
      status: bookingData.status 
    });

    await booking.save();
    
    // Atomic Update for Customer Stats
    const amountToAdd = booking.amountPaid || 0; 
    await Customer.findByIdAndUpdate(finalCustId, {
      $inc: { totalBookings: 1, totalSpent: amountToAdd }
    });
    
    // Update Calendar
    await Media.findByIdAndUpdate(resolvedMediaId, {
      $push: { 
        bookedDates: { 
          start: startDate, 
          end: endDate, 
          bookingId: booking._id 
        } 
      }
    });

    // Sync Media Status
    await syncMediaStatus(resolvedMediaId);

    // Logger
    await logActivity(req, 'CREATE', 'BOOKING', `Created booking for Customer ${finalCustId}`, { bookingId: booking._id });
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      message: 'Failed to create booking', 
      error: error.message 
    });
  }
});

// Update booking (With Optimistic Locking via .save())
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updateData = { ...req.body };

    // 1. Fetch Document (Do NOT use findByIdAndUpdate)
    // We need the document instance to check versioning (__v)
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const oldAmountPaid = booking.amountPaid || 0;
    const oldMediaId = booking.mediaId; // Could be ID or Object

    // 2. Concurrency Check: Date Overlap
    // Only check if dates are changing
    if (updateData.startDate || updateData.endDate) {
      const newStart = updateData.startDate || booking.startDate;
      const newEnd = updateData.endDate || booking.endDate;
      const targetMediaId = updateData.mediaId || oldMediaId;

      // Extract raw ID if mediaId is an object
      const rawMediaId = (typeof targetMediaId === 'object' && targetMediaId !== null) 
        ? (targetMediaId._id || targetMediaId.id) 
        : targetMediaId;

      const conflict = await checkForOverlap(rawMediaId, newStart, newEnd, bookingId);
      if (conflict) {
         return res.status(409).json({ message: 'Conflict! These dates overlap with another active booking.' });
      }
    }

    // 3. Apply Updates Manually
    // This marks fields as modified for Mongoose
    Object.keys(updateData).forEach(key => {
      // Protect immutable fields
      if (key !== '_id' && key !== 'mediaId' && key !== 'customerId') {
        booking[key] = updateData[key];
      }
    });

    // Payment Logic
    if (booking.status === 'Cancelled') {
      booking.paymentStatus = 'Cancelled';
    } else {
       const currentPaid = booking.amountPaid !== undefined ? Number(booking.amountPaid) : 0;
       const currentTotal = booking.amount !== undefined ? Number(booking.amount) : 0;
       
       if (currentPaid >= currentTotal) booking.paymentStatus = 'Paid';
       else if (currentPaid > 0) booking.paymentStatus = 'Partially Paid';
       else booking.paymentStatus = 'Pending';
    }

    // 4. SAVE (Optimistic Locking)
    // If 'booking' was modified by another user since we fetched it,
    // Mongoose will throw a VersionError here.
    await booking.save();

    // 5. Post-Save Logic (Calendar & Stats)
    
    // Manage Calendar Dates
    // Use the stored ID (handle population edge case)
    const mediaIdToUpdate = oldMediaId._id || oldMediaId;

    if (mediaIdToUpdate) {
      // Remove old date entry for this booking
      await Media.findByIdAndUpdate(mediaIdToUpdate, { 
        $pull: { bookedDates: { bookingId: booking._id } }
      });

      // If active, push new date entry
      if (booking.status !== 'Cancelled') {
        await Media.findByIdAndUpdate(mediaIdToUpdate, {
           $push: { bookedDates: { start: booking.startDate, end: booking.endDate, bookingId: booking._id } }
        });
      }
      await syncMediaStatus(mediaIdToUpdate);
    }

    // Stats - Atomic Update (Difference Only)
    if (booking.amountPaid !== oldAmountPaid) {
      const difference = (booking.amountPaid || 0) - oldAmountPaid;
      if (difference !== 0) {
        await Customer.findByIdAndUpdate(booking.customerId, {
          $inc: { totalSpent: difference }
        });
      }
    }

    await logActivity(req, 'UPDATE', 'BOOKING', `Updated booking status: ${booking.status}`, { bookingId: booking._id });

    res.json(booking);
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({ message: 'Data has changed since you loaded it. Please refresh and try again.' });
    }
    console.error("Update booking error:", error);
    res.status(500).json({ message: 'Failed to update booking' });
  }
});

// Delete booking
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { deleted: true, deletedAt: new Date() }, 
      { new: true }
    );
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Atomic Decrement
    await Customer.findByIdAndUpdate(booking.customerId, {
      $inc: { totalBookings: -1, totalSpent: -(booking.amountPaid || 0) }
    });

    const mediaId = booking.mediaId && (booking.mediaId._id || booking.mediaId);
    if (mediaId) {
      await Media.findByIdAndUpdate(mediaId, {
         $pull: { bookedDates: { bookingId: booking._id } }
      });
      await syncMediaStatus(mediaId);
    }

    // Logger
    await logActivity(req, 'DELETE', 'BOOKING', `Deleted booking ${req.params.id}`, { bookingId: booking._id });

    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete booking' });
  }
});

module.exports = router;