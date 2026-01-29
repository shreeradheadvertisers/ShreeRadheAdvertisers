/**
 * Maintenance Routes - With Audit Logging
 */

const express = require('express');
const router = express.Router();
const { Maintenance, Media } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('../services/logger');

// Get all maintenance records (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { mediaId, status, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (mediaId) filter.mediaId = mediaId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Maintenance.find(filter)
        .populate('mediaId')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Maintenance.countDocuments(filter)
    ]);

    res.json({ data: records, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch maintenance records' });
  }
});

// Get single maintenance record (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id).populate('mediaId');
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch maintenance record' });
  }
});

// Create maintenance record (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const record = new Maintenance(req.body);
    await record.save();
    
    // Update media status to Maintenance
    if (req.body.mediaId) {
      await Media.findByIdAndUpdate(req.body.mediaId, { status: 'Maintenance' });
    }

    // LOG ACTIVITY
    await logActivity(req, 'CREATE', 'MEDIA', `Reported Maintenance: ${req.body.issue}`, { taskId: record._id });
    
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create maintenance record' });
  }
});

// Update maintenance record (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // LOG ACTIVITY
    await logActivity(req, 'UPDATE', 'MEDIA', `Updated Maintenance Task: ${record.issue}`, { taskId: record._id });

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update maintenance record' });
  }
});

// Complete maintenance (protected)
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const record = await Maintenance.findByIdAndUpdate(
      req.params.id, 
      { status: 'Completed', completedDate: new Date() }, 
      { new: true }
    );
    
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    
    // Update media status back to Available
    if (record.mediaId) {
      await Media.findByIdAndUpdate(record.mediaId, { status: 'Available' });
    }

    // LOG ACTIVITY
    await logActivity(req, 'UPDATE', 'MEDIA', `Completed Maintenance Task: ${record.issue}`, { taskId: record._id });
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete maintenance' });
  }
});

module.exports = router;