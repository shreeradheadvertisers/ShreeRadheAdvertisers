/**
 * Payment Routes - Fixed Revenue Calculation
 * Now excludes payments if the parent Booking is Cancelled
 */

const express = require('express');
const router = express.Router();
const { Payment, Booking, Customer } = require('../models');
const { authMiddleware } = require('../middleware/auth');

// Get all payments (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { bookingId, customerId, page = 1, limit = 50 } = req.query;
    
    const filter = {};
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
      const newAmountPaid = booking.amountPaid + req.body.amount;
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
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment' });
  }
});

// --- FIXED STATISTICS ROUTE ---
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    // 1. Calculate Total Collected
    // We must JOIN with Booking to ensure we ignore payments for Cancelled bookings
    const stats = await Payment.aggregate([
      { $match: { status: 'Completed' } },
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
          'bookingDetails.status': { $ne: 'Cancelled' } // <--- CRITICAL FIX
        } 
      },
      { $group: { _id: null, totalCollected: { $sum: '$amount' } } }
    ]);

    // 2. Calculate Pending Dues
    const pendingBookings = await Booking.aggregate([
      { 
        $match: { 
          deleted: false, 
          status: { $ne: 'Cancelled' }, // Exclude Cancelled
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