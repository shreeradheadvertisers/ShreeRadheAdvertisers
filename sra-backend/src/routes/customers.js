/**
 * Customer Routes - Updated with Dynamic Stats Aggregation
 */

const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Booking = require('../models/Booking'); // Import Booking model
const { authMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all customers (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { group, search, page = 1, limit = 50 } = req.query;
    
    // Build Match Stage
    const matchStage = { deleted: false };
    if (group) matchStage.group = group;
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Dynamic Aggregation to get real-time stats
    const aggregationPipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      // Join with Bookings to calculate stats on the fly
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'customerId',
          as: 'bookings_data'
        }
      },
      // Calculate totals
      {
        $addFields: {
          totalBookings: { $size: "$bookings_data" },
          totalSpent: { $sum: "$bookings_data.amount" } // Calculates total value of bookings
        }
      },
      // Remove the heavy bookings array from result
      { $project: { bookings_data: 0 } }
    ];

    const [customers, total] = await Promise.all([
      Customer.aggregate(aggregationPipeline),
      Customer.countDocuments(matchStage)
    ]);

    res.json({ data: customers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error("Fetch customers error:", error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// Get single customer (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const customerId = new mongoose.Types.ObjectId(req.params.id);

    const customerData = await Customer.aggregate([
      { $match: { _id: customerId, deleted: false } },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'customerId',
          as: 'bookings_data'
        }
      },
      {
        $addFields: {
          totalBookings: { $size: "$bookings_data" },
          totalSpent: { $sum: "$bookings_data.amount" }
        }
      },
      { $project: { bookings_data: 0 } }
    ]);

    if (!customerData || customerData.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customerData[0]);
  } catch (error) {
    console.error("Fetch single customer error:", error);
    res.status(500).json({ message: 'Failed to fetch customer' });
  }
});

// Create customer (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create customer' });
  }
});

// Update customer (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update customer' });
  }
});

// Delete customer (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id, 
      { deleted: true, deletedAt: new Date() }, 
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete customer' });
  }
});

module.exports = router;