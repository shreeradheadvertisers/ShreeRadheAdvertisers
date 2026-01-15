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

    // FIX: Resolve IDs before querying
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
    // FIX: Resolve Customer ID here (e.g., convert "SRA-CUST-001" to ObjectId)
    const resolvedCustId = await resolveId(Customer, req.params.customerId);
    
    if (!resolvedCustId) {
       // If we can't find the customer, return empty list instead of error
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
    // If we can't find by custom ID, and it looks like a MongoID, use it directly, else fail
    const finalCustId = resolvedCustId || (customerId.match(/^[0-9a-fA-F]{24}$/) ? customerId : null);
    
    if (!finalCustId) return res.status(404).json({ message: `Customer with ID ${customerId} not found` });

    const booking = new Booking({
      ...bookingData,
      mediaId: resolvedMediaId,
      customerId: finalCustId
    });

    await booking.save();
    
    // 2. FIX: Update customer stats (Count AND Total Spent)
    // We use amountPaid if available, otherwise 0. Or you can use 'amount' for Total Contract Value.
    // Usually 'totalSpent' implies actual money paid.
    const amountToAdd = booking.amountPaid || 0; 
    
    await Customer.findByIdAndUpdate(finalCustId, {
      $inc: { 
        totalBookings: 1,
        totalSpent: amountToAdd 
      }
    });
    
    // 3. Update media status
    await Media.findByIdAndUpdate(resolvedMediaId, { 
      status: 'Booked',
      $push: { 
        bookedDates: { 
          start: req.body.startDate, 
          end: req.body.endDate, 
          bookingId: booking._id 
        } 
      }
    });
    
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

    // 1. Safety: If mediaId or customerId are objects (populated from frontend), extract the IDs
    if (updateData.mediaId && typeof updateData.mediaId === 'object') {
      updateData.mediaId = updateData.mediaId._id || updateData.mediaId.id;
    }
    if (updateData.customerId && typeof updateData.customerId === 'object') {
      updateData.customerId = updateData.customerId._id || updateData.customerId.id;
    }

    // 2. Get the old booking state to check for status changes
    const oldBooking = await Booking.findById(bookingId);
    if (!oldBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 3. Update the booking
    const booking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });

    // 4. SYNC MEDIA STATUS: Update media asset if booking status changed
    const freeingStatuses = ['Completed', 'Cancelled'];
    const occupyingStatuses = ['Active', 'Upcoming'];

    if (updateData.status && updateData.status !== oldBooking.status) {
      if (freeingStatuses.includes(updateData.status)) {
        // Change Media status to 'Available'
        await Media.findByIdAndUpdate(booking.mediaId, { 
          status: 'Available',
          // If cancelled, also remove the dates from the media calendar
          ...(updateData.status === 'Cancelled' && { 
            $pull: { bookedDates: { bookingId: booking._id } } 
          })
        });
      } else if (occupyingStatuses.includes(updateData.status)) {
        // Change Media status back to 'Booked'
        await Media.findByIdAndUpdate(booking.mediaId, { status: 'Booked' });
      }
    }

    // 5. Update Customer Total Spent if payment amount changed
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

// Delete booking - soft delete (protected)
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

    // Optional: Decrement stats on delete
    await Customer.findByIdAndUpdate(booking.customerId, {
      $inc: { 
        totalBookings: -1,
        totalSpent: -(booking.amountPaid || 0)
      }
    });

    // Also free up the media status
    await Media.findByIdAndUpdate(booking.mediaId, {
       status: 'Available',
       $pull: { bookedDates: { bookingId: booking._id } }
    });

    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete booking' });
  }
});

module.exports = router;