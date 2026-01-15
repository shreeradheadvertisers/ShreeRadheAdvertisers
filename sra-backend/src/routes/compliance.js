/**
 * Compliance Routes - Tenders and Tax Records
 * Handles centralized storage and status calculation for MongoDB
 */

const express = require('express');
const router = express.Router();
const { Tender, TaxRecord } = require('../models');
const { authMiddleware } = require('../middleware/auth');

/**
 * Unified Compliance Fetch
 * GET /api/compliance
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [tenders, taxes] = await Promise.all([
      Tender.find({ deleted: { $ne: true } }).sort({ endDate: 1 }),
      TaxRecord.find({ deleted: { $ne: true } }).sort({ dueDate: 1 })
    ]);

    const tendersWithStatus = tenders.map(t => {
      let status = 'Active';
      if (t.endDate < now) status = 'Expired';
      else if (t.endDate <= thirtyDaysLater) status = 'Expiring Soon';
      return { ...t.toObject(), status, id: t._id };
    });

    const taxesWithStatus = taxes.map(t => {
      let status = t.status;
      if (status !== 'Paid' && t.dueDate < now) status = 'Overdue';
      return { ...t.toObject(), status, id: t._id };
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

// Create tender
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
 * Handles: DELETE /api/compliance/tenders/:id or /api/compliance/taxes/:id
 */
router.delete('/:type/:id', authMiddleware, async (req, res) => {
  try {
    const { type, id } = req.params;
    const isTender = type === 'agreement' || type === 'tenders';
    const Model = isTender ? Tender : TaxRecord;
    
    const record = await Model.findByIdAndUpdate(id, { 
      deleted: true, 
      deletedAt: new Date() 
    });

    if (!record) return res.status(404).json({ message: 'Record not found' });

    // CASCADING DELETE: If an agreement is deleted, also hide its pending taxes
    if (isTender) {
      await TaxRecord.updateMany(
        { tenderId: id, status: 'Pending' }, 
        { deleted: true, deletedAt: new Date() }
      );
    }

    res.json({ success: true, message: 'Moved to recycle bin' });
  } catch (error) {
    res.status(500).json({ message: 'Delete operation failed' });
  }
});

/**
 * Permanent Delete - Remove from MongoDB forever
 * DELETE /api/compliance/permanent/:type/:id
 */
router.delete('/permanent/:type/:id', authMiddleware, async (req, res) => {
  try {
    const { type, id } = req.params;
    const isTender = type === 'agreement' || type === 'tenders';
    const Model = isTender ? Tender : TaxRecord;
    
    // Find the record first to ensure it's already soft-deleted
    const record = await Model.findOne({ _id: id, deleted: true });
    if (!record) {
      return res.status(400).json({ message: 'Only items in the Recycle Bin can be permanently deleted' });
    }

    await Model.findByIdAndDelete(id);

    // If it was a tender, permanently remove all its associated taxes too
    if (isTender) {
      await TaxRecord.deleteMany({ tenderId: id });
    }

    res.json({ success: true, message: 'Record permanently purged' });
  } catch (error) {
    res.status(500).json({ message: 'Permanent delete failed' });
  }
});

/**
 * Restore from Recycle Bin
 * Handles: POST /api/compliance/restore/:id
 */
router.post('/restore/:id', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;
    const { id } = req.params;
    
    // Normalize type to handle different string inputs
    const isTender = ['agreement', 'tenders', 'tender'].includes(type.toLowerCase());
    const Model = isTender ? Tender : TaxRecord;
    
    // 1. Restore the main record
    const restoredRecord = await Model.findByIdAndUpdate(id, { 
      deleted: false, 
      deletedAt: null 
    }, { new: true });

    if (!restoredRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // 2. CASCADING RESTORE: If it's an agreement, restore all its taxes automatically
    if (isTender) {
      await TaxRecord.updateMany(
        { tenderId: id }, 
        { deleted: false, deletedAt: null }
      );
    }
    
    res.json({ 
      success: true, 
      message: isTender 
        ? 'Agreement and associated taxes restored successfully' 
        : 'Tax record restored successfully' 
    });
  } catch (error) {
    console.error('Restore Error:', error);
    res.status(500).json({ message: 'Restore operation failed' });
  }
});

// Pay tax
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

// Compliance stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [activeTenders, expiringTenders, pendingTaxes, overdueTaxes, taxPaidAgg, taxLiabilityAgg] = await Promise.all([
      Tender.countDocuments({ deleted: false, endDate: { $gte: now } }),
      Tender.countDocuments({ deleted: false, endDate: { $gte: now, $lte: thirtyDaysLater } }),
      TaxRecord.countDocuments({ deleted: false, status: 'Pending' }),
      TaxRecord.countDocuments({ deleted: false, status: { $ne: 'Paid' }, dueDate: { $lt: now } }),
      TaxRecord.aggregate([
        { $match: { status: 'Paid', deleted: false } }, 
        { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', 0] } } } }
      ]),
      TaxRecord.aggregate([
        { $match: { status: { $ne: 'Paid' }, deleted: false } }, 
        { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', 0] } } } }
      ])
    ]);

    res.json({
      totalActiveTenders: activeTenders || 0,
      expiringTenders: expiringTenders || 0,
      pendingTaxes: pendingTaxes || 0,
      overdueTaxes: overdueTaxes || 0,
      totalTaxPaid: taxPaidAgg[0]?.total || 0,
      totalTaxLiability: taxLiabilityAgg[0]?.total || 0
    });
  } catch (error) {
    console.error('Compliance Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch compliance stats' });
  }
});

module.exports = router;