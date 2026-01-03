/**
 * Compliance Routes - Tenders and Tax Records
 * Handles centralized storage and status calculation for MongoDB
 */

const express = require('express');
const router = express.Router();
const { Tender, TaxRecord } = require('../models');
const { authMiddleware } = require('../middleware/auth');

/**
 * Unified Compliance Fetch (Used by useCompliance hook)
 * GET /api/compliance
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Fetch both collections in parallel
    const [tenders, taxes] = await Promise.all([
      Tender.find({ deleted: { $ne: true } }).sort({ endDate: 1 }),
      TaxRecord.find({ deleted: { $ne: true } }).sort({ dueDate: 1 })
    ]);

    // Map Tender Status (Active/Expired/Expiring Soon)
    const tendersWithStatus = tenders.map(t => {
      let status = 'Active';
      if (t.endDate < now) status = 'Expired';
      else if (t.endDate <= thirtyDaysLater) status = 'Expiring Soon';
      return { 
        ...t.toObject(), 
        status,
        id: t._id // Map _id to id for frontend compatibility
      };
    });

    // Map Tax Status (Paid/Pending/Overdue)
    const taxesWithStatus = taxes.map(t => {
      let status = t.status;
      if (status !== 'Paid' && t.dueDate < now) status = 'Overdue';
      return { 
        ...t.toObject(), 
        status,
        id: t._id 
      };
    });

    res.json({ 
      success: true, 
      tenders: tendersWithStatus, 
      taxes: taxesWithStatus 
    });
  } catch (error) {
    console.error('Compliance Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch compliance records' });
  }
});

// Create tender (protected)
router.post('/tenders', authMiddleware, async (req, res) => {
  try {
    const tender = new Tender(req.body);
    await tender.save();
    res.status(201).json({ success: true, data: tender });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create tender' });
  }
});

/**
 * Soft Delete - Move to Recycle Bin
 */
router.delete('/:type/:id', authMiddleware, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = type === 'agreement' || type === 'tenders' ? Tender : TaxRecord;
    
    await Model.findByIdAndUpdate(id, { 
      deleted: true, 
      deletedAt: new Date() 
    });

    res.json({ success: true, message: 'Moved to recycle bin' });
  } catch (error) {
    res.status(500).json({ message: 'Delete operation failed' });
  }
});

/**
 * Restore from Recycle Bin
 */
router.post('/restore/:id', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;
    const Model = type === 'agreement' ? Tender : TaxRecord;
    
    await Model.findByIdAndUpdate(req.params.id, { 
      deleted: false, 
      deletedAt: null 
    });
    
    res.json({ success: true, message: 'Record restored successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Restore operation failed' });
  }
});

// Pay tax (protected)
router.post('/taxes/:id/pay', authMiddleware, async (req, res) => {
  try {
    const { receiptUrl } = req.body;
    const tax = await TaxRecord.findByIdAndUpdate(
      req.params.id, 
      { status: 'Paid', paymentDate: new Date(), documentUrl: receiptUrl }, 
      { new: true }
    );
    
    if (!tax) return res.status(404).json({ message: 'Tax record not found' });
    res.json({ success: true, data: tax });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tax payment' });
  }
});

// Compliance stats (protected)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [activeTenders, expiringTenders, pendingTaxes, overdueTaxes, taxPaid, taxLiability] = await Promise.all([
      Tender.countDocuments({ deleted: false, endDate: { $gte: now } }),
      Tender.countDocuments({ deleted: false, endDate: { $gte: now, $lte: thirtyDaysLater } }),
      TaxRecord.countDocuments({ deleted: false, status: 'Pending' }),
      TaxRecord.countDocuments({ deleted: false, status: { $ne: 'Paid' }, dueDate: { $lt: now } }),
      TaxRecord.aggregate([{ $match: { status: 'Paid', deleted: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      TaxRecord.aggregate([{ $match: { status: { $ne: 'Paid' }, deleted: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);

    res.json({
      totalActiveTenders: activeTenders,
      expiringTenders,
      pendingTaxes,
      overdueTaxes,
      totalTaxPaid: taxPaid[0]?.total || 0,
      totalTaxLiability: taxLiability[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch compliance stats' });
  }
});

module.exports = router;