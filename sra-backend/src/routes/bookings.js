/**
 * Booking Routes
 */

const express = require('express');
const router = express.Router();
const { Booking, Customer, Media } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// Helper: Resolve Custom ID to ObjectId
const resolveId = async (Model, id) => {
  if (!id) return null;
  // If it's already a valid ObjectId, return it
  if (id.match(/^[0-9a-fA-F]{24}$/)) return id;
  
  // Otherwise, try to find the document by its custom 'id' field
  const doc = await Model.findOne({ id: id });
  return doc ? doc._id : null;
};

// Get all bookings (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let { customerId, mediaId, status, paymentStatus, page = 1, limit = 50 } = req.query;
    
    const filter = { deleted: false };

    // Resolve IDs before querying
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

// Get single booking (protected)
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

// Get bookings by customer (protected)
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

// Create booking (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log("Received Booking Payload:", req.body); 

    let { mediaId, customerId, ...bookingData } = req.body;

    // 1. Resolve IDs
    const resolvedMediaId = await resolveId(Media, mediaId);
    if (!resolvedMediaId) return res.status(404).json({ message: `Media with ID ${mediaId} not found` });
    
    const resolvedCustId = await resolveId(Customer, customerId);
    const finalCustId = resolvedCustId || (customerId.match(/^[0-9a-fA-F]{24}$/) ? customerId : null);
    
    if (!finalCustId) return res.status(404).json({ message: `Customer with ID ${customerId} not found` });

    const booking = new Booking({
      ...bookingData,
      mediaId: resolvedMediaId,
      customerId: finalCustId
    });

    await booking.save();
    
    // 2. Update customer stats
    const amountToAdd = booking.amountPaid || 0; 
    await Customer.findByIdAndUpdate(finalCustId, {
      $inc: { 
        totalBookings: 1,
        totalSpent: amountToAdd 
      }
    });
    
    // 3. Update media status and Calendar
    // FIX: Only set status to 'Booked' if the booking is currently active (today is between start and end)
    const now = new Date();
    const start = new Date(req.body.startDate);
    const end = new Date(req.body.endDate);
    
    const isActiveNow = now >= start && now <= end;

    const mediaUpdate = {
      $push: { 
        bookedDates: { 
          start: req.body.startDate, 
          end: req.body.endDate, 
          bookingId: booking._id 
        } 
      }
    };

    // If booking is active NOW, mark media as Booked.
    // If booking is FUTURE, leave it as is (Available or whatever it currently is).
    if (isActiveNow) {
      mediaUpdate.status = 'Booked';
    }

    await Media.findByIdAndUpdate(resolvedMediaId, mediaUpdate);
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      message: 'Failed to create booking', 
      error: error.message 
    });
  }
});

// Update booking (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updateData = { ...req.body };

    // 1. Safety: ID extraction
    if (updateData.mediaId && typeof updateData.mediaId === 'object') {
      updateData.mediaId = updateData.mediaId._id || updateData.mediaId.id;
    }
    if (updateData.customerId && typeof updateData.customerId === 'object') {
      updateData.customerId = updateData.customerId._id || updateData.customerId.id;
    }

    // 2. Get the old booking
    const oldBooking = await Booking.findById(bookingId);
    if (!oldBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // --- PAYMENT LOGIC ---
    if (updateData.status === 'Cancelled') {
      updateData.paymentStatus = 'Cancelled';
    }
    else if (oldBooking.status === 'Cancelled' && updateData.status && updateData.status !== 'Cancelled') {
       const currentPaid = updateData.amountPaid !== undefined ? Number(updateData.amountPaid) : (oldBooking.amountPaid || 0);
       const currentTotal = updateData.amount !== undefined ? Number(updateData.amount) : oldBooking.amount;
       
       if (currentPaid >= currentTotal) updateData.paymentStatus = 'Paid';
       else if (currentPaid > 0) updateData.paymentStatus = 'Partially Paid';
       else updateData.paymentStatus = 'Pending';
    }

    // 3. Update the booking
    const booking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });

    // 4. SYNC MEDIA STATUS
    const now = new Date();
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const isActiveNow = now >= start && now <= end;

    // A. Handle Cancellation
    if (updateData.status === 'Cancelled' && oldBooking.status !== 'Cancelled') {
      // Pull dates from calendar
      await Media.findByIdAndUpdate(booking.mediaId, { 
        $pull: { bookedDates: { bookingId: booking._id } } 
      });

      // If this was an ACTIVE booking, free up the media
      // (We check if the media is currently marked as Booked to be safe)
      if (isActiveNow) {
        await Media.findByIdAndUpdate(booking.mediaId, { status: 'Available' });
      }
    } 
    
    // B. Handle Restoration or Date Change
    else if (updateData.status && updateData.status !== 'Cancelled') {
      // 1. Refresh calendar dates (Remove old, Add new to avoid duplication)
      //    We use $pull and then $push to ensure dates are updated if they changed
      await Media.findByIdAndUpdate(booking.mediaId, {
         $pull: { bookedDates: { bookingId: booking._id } }
      });
      await Media.findByIdAndUpdate(booking.mediaId, {
         $push: { bookedDates: { start: booking.startDate, end: booking.endDate, bookingId: booking._id } }
      });

      // 2. Update Status ONLY if it's currently active
      if (isActiveNow) {
        await Media.findByIdAndUpdate(booking.mediaId, { status: 'Booked' });
      } 
      // Note: If it's a future booking, we don't automatically set it to 'Available' 
      // because there might be *another* booking active right now.
    }

    // 5. Update Customer Stats
    if (booking.amountPaid !== oldBooking.amountPaid) {
      const difference = (booking.amountPaid || 0) - (oldBooking.amountPaid || 0);
      if (difference !== 0) {
        await Customer.findByIdAndUpdate(booking.customerId, {
          $inc: { totalSpent: difference }
        });
      }
    }

    res.json(booking);
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({ message: 'Failed to update booking' });
  }
});

// Delete booking (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { deleted: true, deletedAt: new Date() }, 
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Decrement stats
    await Customer.findByIdAndUpdate(booking.customerId, {
      $inc: { 
        totalBookings: -1,
        totalSpent: -(booking.amountPaid || 0)
      }
    });

    // Remove dates from media
    await Media.findByIdAndUpdate(booking.mediaId, {
       $pull: { bookedDates: { bookingId: booking._id } }
    });

    // If this booking was currently occupying the media, set it to Available
    const now = new Date();
    if (now >= booking.startDate && now <= booking.endDate) {
       await Media.findByIdAndUpdate(booking.mediaId, { status: 'Available' });
    }

    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete booking' });
  }
});

module.exports = router;