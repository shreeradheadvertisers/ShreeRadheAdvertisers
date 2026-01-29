/**
 * Payment Routes - Fixed Statistics & Audit Logging
 * Strictly excludes Cancelled bookings from Collected and Pending figures.
 */

const express = require('express');
const router = express.Router();
const { Payment, Booking, Customer } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('../services/logger');

// Get all payments (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { bookingId, customerId, page = 1, limit = 50 } = req.query;
    
    const filter = { deleted: false }; // Ensure we only show non-deleted payments
    if (bookingId) filter.bookingId = bookingId;
    if (customerId) filter.customerId = customerId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('bookingId')
        .populate('customerId')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Payment.countDocuments(filter)
    ]);

    res.json({ data: payments, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Get single payment (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId')
      .populate('customerId');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment' });
  }
});

// Create payment (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    
    // Update booking payment status
    const booking = await Booking.findById(req.body.bookingId);
    if (booking) {
      const newAmountPaid = (booking.amountPaid || 0) + req.body.amount;
      let paymentStatus = 'Partially Paid';
      if (newAmountPaid >= booking.amount) {
        paymentStatus = 'Paid';
      }
      await Booking.findByIdAndUpdate(req.body.bookingId, {
        amountPaid: newAmountPaid,
        paymentStatus
      });
      
      // Update customer total spent
      await Customer.findByIdAndUpdate(req.body.customerId, {
        $inc: { totalSpent: req.body.amount }
      });
    }

    // LOG ACTIVITY
    await logActivity(req, 'CREATE', 'PAYMENT', `Recorded Payment: ₹${payment.amount}`, { paymentId: payment._id, bookingId: payment.bookingId });
    
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create payment' });
  }
});

// Update payment (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // LOG ACTIVITY
    await logActivity(req, 'UPDATE', 'PAYMENT', `Updated Payment Record: ₹${payment.amount}`, { paymentId: payment._id });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment' });
  }
});

// Delete Payment (Soft Delete) - Added back for Recycle Bin support
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { deleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Reverse calculations (Subtract amount from Booking & Customer)
    if (payment.bookingId) {
      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        const newTotal = Math.max(0, (booking.amountPaid || 0) - payment.amount);
        let newStatus = 'Partially Paid';
        if (newTotal >= booking.amount) newStatus = 'Paid';
        if (newTotal <= 0) newStatus = 'Pending';

        await Booking.findByIdAndUpdate(payment.bookingId, { 
          amountPaid: newTotal, 
          paymentStatus: newStatus 
        });

        if (booking.customerId) {
           await Customer.findByIdAndUpdate(booking.customerId, { $inc: { totalSpent: -payment.amount } });
        }
      }
    }

    // LOG ACTIVITY
    await logActivity(req, 'DELETE', 'PAYMENT', `Deleted Payment: ₹${payment.amount}`, { paymentId: payment._id });

    res.json({ message: 'Payment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete payment' });
  }
});

// --- FIXED STATISTICS ROUTE ---
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    // 1. Calculate Total Collected (Strictly ignoring Cancelled bookings)
    const stats = await Payment.aggregate([
      { $match: { status: 'Completed', deleted: false } }, // Ensure payment itself isn't deleted
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'bookingDetails'
        }
      },
      { $unwind: '$bookingDetails' },
      { 
        $match: { 
          'bookingDetails.deleted': false,
          'bookingDetails.status': { $ne: 'Cancelled' } // STRICT EXCLUSION
        } 
      },
      { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
    ]);

    // 2. Calculate Pending Dues (Strictly ignoring Cancelled bookings)
    const pendingBookings = await Booking.aggregate([
      { 
        $match: { 
          deleted: false, 
          status: { $ne: 'Cancelled' }, // STRICT EXCLUSION
          paymentStatus: { $in: ['Pending', 'Partially Paid'] } 
        } 
      },
      {
        $group: {
          _id: null,
          pending: { 
            $sum: { 
              $subtract: [
                { $ifNull: ['$amount', 0] }, 
                { $ifNull: ['$amountPaid', 0] }
              ] 
            } 
          }
        }
      }
    ]);

    res.json({
      totalCollected: stats[0]?.totalCollected || 0,
      pending: pendingBookings[0]?.pending || 0,
      overdue: 0
    });
  } catch (error) {
    console.error('Payment Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment stats' });
  }
});

module.exports = router;