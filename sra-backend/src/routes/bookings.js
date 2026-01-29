/**
 * Booking Routes
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

// --- SYNC MEDIA STATUS (Based on Booking Status) ---
// We trust the "Active" status stored in the DB.
const syncMediaStatus = async (mediaId) => {
  try {
    if (!mediaId) return;

    // 1. Find ANY booking that is explicitly marked 'Active'
    // We do NOT check dates here. We trust the booking status.
    const activeBooking = await Booking.findOne({
      mediaId: mediaId,
      deleted: false,
      status: 'Active' 
    });

    const media = await Media.findById(mediaId);
    if (!media) return;

    if (activeBooking) {
      // If an Active booking exists, Media MUST be Booked
      if (media.status !== 'Booked') {
        console.log(`[Sync] Locking Media ${mediaId} (Found Active Booking)`);
        await Media.findByIdAndUpdate(mediaId, { status: 'Booked' });
      }
    } else {
      // If NO Active booking exists, Media should be Available
      // (Only revert if it was 'Booked', to preserve Maintenance/Coming Soon)
      if (media.status === 'Booked') {
        console.log(`[Sync] Freeing Media ${mediaId} (No Active Bookings)`);
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

    if (customerId) {
      const resolvedCustId = await resolveId(Customer, customerId);
      if (resolvedCustId) filter.customerId = resolvedCustId;
    }
    if (mediaId) {
      const resolvedMediaId = await resolveId(Media, mediaId);
      if (resolvedMediaId) filter.mediaId = resolvedMediaId;
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

// Create booking
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log("Received Booking Payload:", req.body); 

    let { mediaId, customerId, ...bookingData } = req.body;

    const resolvedMediaId = await resolveId(Media, mediaId);
    if (!resolvedMediaId) return res.status(404).json({ message: `Media with ID ${mediaId} not found` });
    
    const resolvedCustId = await resolveId(Customer, customerId);
    const finalCustId = resolvedCustId || (customerId.match(/^[0-9a-fA-F]{24}$/) ? customerId : null);
    
    if (!finalCustId) return res.status(404).json({ message: `Customer with ID ${customerId} not found` });

    // FIX: Default to 'Upcoming' only if status is completely missing.
    // Otherwise, trust the frontend (which might send 'Active' for today's bookings).
    if (!bookingData.status) {
        bookingData.status = 'Upcoming';
    }

    const booking = new Booking({
      ...bookingData,
      mediaId: resolvedMediaId,
      customerId: finalCustId,
      status: bookingData.status 
    });

    await booking.save();
    
    // Update customer stats
    const amountToAdd = booking.amountPaid || 0; 
    await Customer.findByIdAndUpdate(finalCustId, {
      $inc: { totalBookings: 1, totalSpent: amountToAdd }
    });
    
    // Update Calendar
    await Media.findByIdAndUpdate(resolvedMediaId, {
      $push: { 
        bookedDates: { 
          start: bookingData.startDate, 
          end: bookingData.endDate, 
          bookingId: booking._id 
        } 
      }
    });

    // Sync Media Status based on the saved booking
    await syncMediaStatus(resolvedMediaId);

    // Logger function
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

// Update booking
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updateData = { ...req.body };

    if (updateData.mediaId && typeof updateData.mediaId === 'object') {
      updateData.mediaId = updateData.mediaId._id || updateData.mediaId.id;
    }
    if (updateData.customerId && typeof updateData.customerId === 'object') {
      updateData.customerId = updateData.customerId._id || updateData.customerId.id;
    }

    // 1. Get Old Booking
    const oldBooking = await Booking.findById(bookingId);
    if (!oldBooking) return res.status(404).json({ message: 'Booking not found' });

    // FIX: REMOVED CALCULATE STATUS LOGIC
    // We blindly trust the frontend. If the frontend says "Active", we save "Active".
    // This prevents the backend's timezone differences from overwriting the correct status.

    // Payment Logic
    if (updateData.status === 'Cancelled') {
      updateData.paymentStatus = 'Cancelled';
    }
    else if (oldBooking.status === 'Cancelled' && updateData.status !== 'Cancelled') {
       const currentPaid = updateData.amountPaid !== undefined ? Number(updateData.amountPaid) : (oldBooking.amountPaid || 0);
       const currentTotal = updateData.amount !== undefined ? Number(updateData.amount) : oldBooking.amount;
       
       if (currentPaid >= currentTotal) updateData.paymentStatus = 'Paid';
       else if (currentPaid > 0) updateData.paymentStatus = 'Partially Paid';
       else updateData.paymentStatus = 'Pending';
    }

    // 2. Perform Update
    const booking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });

    // 3. Manage Calendar Dates
    const mediaId = booking.mediaId && (booking.mediaId._id || booking.mediaId);

    if (mediaId) {
      await Media.findByIdAndUpdate(mediaId, { 
        $pull: { bookedDates: { bookingId: booking._id } }
      });

      // If still active/upcoming/completed (not cancelled), add new dates
      if (booking.status !== 'Cancelled') {
        await Media.findByIdAndUpdate(mediaId, {
           $push: { bookedDates: { start: booking.startDate, end: booking.endDate, bookingId: booking._id } }
        });
      }

      // 4. Sync Media Status (Based on the 'Active' status we just saved)
      await syncMediaStatus(mediaId);
    }

    // 5. Stats
    if (booking.amountPaid !== oldBooking.amountPaid) {
      const difference = (booking.amountPaid || 0) - (oldBooking.amountPaid || 0);
      if (difference !== 0) {
        await Customer.findByIdAndUpdate(booking.customerId, {
          $inc: { totalSpent: difference }
        });
      }
    }

    // Logger function
    await logActivity(req, 'UPDATE', 'BOOKING', `Updated booking status: ${booking.status}`, { bookingId: booking._id });

    res.json(booking);
  } catch (error) {
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

    // Logger function
    await logActivity(req, 'DELETE', 'BOOKING', `Deleted booking ${req.params.id}`, { bookingId: booking._id });

    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete booking' });
  }
});

module.exports = router;