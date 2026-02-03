/**
 * Upload Routes - With Audit Logging
 * Handles Images, Documents, Tender Creation, and Tax Receipt Uploads
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const { upload } = require('../middleware/upload');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('../services/logger');

// --- DATABASE MODELS FOR PERSISTENCE ---
const Tender = require('../models/Tender'); 
const TaxRecord = require('../models/TaxRecord'); 
const Media = require('../models/Media'); // 👈 ADDED: To fetch media name

/**
 * Image Upload - Organizes by District and ID
 */
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });
    const { customId, district } = req.body; 
    
    if (!customId || !district) {
      return res.status(400).json({ message: 'SRA ID and District required' });
    }

    const fileUrl = await uploadToCloudinary(req.file.path, customId, district, 'media');
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    
    // UPDATED: Fetch Media Name AND MongoDB ID for logging & redirection
    let mediaName = 'Unknown';
    let mediaMongoId = null;

    try {
      // Find media by the custom SRA ID and select name + _id
      const mediaItem = await Media.findOne({ id: customId }).select('name _id');
      if (mediaItem) {
        mediaName = mediaItem.name;
        mediaMongoId = mediaItem._id; // Capture _id for frontend redirection
      }
    } catch (e) { 
      console.error("Log lookup error", e); 
    }

    // LOG ACTIVITY WITH NAME AND ID
    await logActivity(
      req, 
      'CREATE', 
      'MEDIA', 
      `Uploaded image for ${mediaName} (${customId})`, 
      { 
        url: fileUrl, 
        customId, 
        mediaName,
        mediaId: mediaMongoId // This enables the click-to-redirect functionality
      }
    );

    res.json({ success: true, url: fileUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Document Upload - Now with Automatic Tax Registry Population
 */
router.post('/document', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No document provided' });

    const { 
      customId, 
      district, 
      type, 
      tenderName, 
      area, 
      startDate, 
      endDate, 
      taxFrequency, 
      licenseFee,
      taxId 
    } = req.body; 
    
    if (!customId || !district) {
      return res.status(400).json({ message: 'Document ID and District required' });
    }

    // 1. Upload to Cloudinary
    const fileUrl = await uploadToCloudinary(req.file.path, customId, district, type || 'documents');
    
    // 2. PERMANENT SAVE TO MONGODB
    if (type === 'tender') {
      const newTender = new Tender({
        tenderName: tenderName || 'New Tender',
        tenderNumber: customId,
        district,
        area: area || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        taxFrequency: taxFrequency || 'Quarterly',
        licenseFee: Number(licenseFee) || 0,
        documentUrl: fileUrl,
        status: 'Active'
      });
      const savedTender = await newTender.save();

      // --- AUTOMATIC TAX INSTALLMENT GENERATION LOGIC ---
      const start = new Date(startDate);
      const end = new Date(endDate);
      const annualFee = Number(licenseFee) || 0;
      const pendingTaxInstallments = [];

      // Determine frequency interval
      let monthsIncrement = 12; // Default Yearly
      if (taxFrequency === 'Quarterly') monthsIncrement = 3;
      if (taxFrequency === 'Monthly') monthsIncrement = 1;

      // Calculate amount per installment
      const installmentAmount = (annualFee / (12 / monthsIncrement)).toFixed(2);

      let currentDueDate = new Date(start);

      // Loop through validity period to create pending records
      while (currentDueDate < end) {
        pendingTaxInstallments.push({
          tenderId: savedTender._id,
          tenderNumber: customId,
          district,
          area: area || '',
          amount: Number(installmentAmount),
          dueDate: new Date(currentDueDate),
          status: 'Pending',
          deleted: false
        });

        // Increment date based on frequency
        currentDueDate.setMonth(currentDueDate.getMonth() + monthsIncrement);
      }

      if (pendingTaxInstallments.length > 0) {
        await TaxRecord.insertMany(pendingTaxInstallments);
      }

      // LOG ACTIVITY
      await logActivity(req, 'CREATE', 'SYSTEM', `Created Tender Agreement & Generated Taxes: ${customId}`, { tenderId: savedTender._id });
    }

    else if (type === 'tax') {
      if (!taxId) {
        return res.status(400).json({ message: 'Tax Record ID is required to mark as paid' });
      }

      // 2. Update the existing pending record instead of creating a new one
      const updatedTax = await TaxRecord.findByIdAndUpdate(
        taxId,
        { 
          receiptUrl: fileUrl, 
          status: 'Paid', 
          paymentDate: new Date() 
        },
        { new: true }
      );

      if (!updatedTax) {
        return res.status(404).json({ message: 'Target tax record not found' });
      }

      // LOG ACTIVITY
      await logActivity(req, 'UPDATE', 'PAYMENT', `Uploaded Tax Receipt & Paid: ${updatedTax.tenderNumber}`, { taxId: updatedTax._id });
    } else {
      
      // Generic Document Upload Log - Try to link to Media if possible
      let mediaMongoId = null;
      let mediaName = 'Unknown';
      try {
         const mediaItem = await Media.findOne({ id: customId }).select('name _id');
         if(mediaItem) {
            mediaMongoId = mediaItem._id;
            mediaName = mediaItem.name;
         }
      } catch(e) {}

      // LOG ACTIVITY
      await logActivity(
        req, 
        'CREATE', 
        'MEDIA', 
        `Uploaded document for ${mediaName}: ${req.file.originalname}`, 
        { 
          url: fileUrl, 
          customId, 
          mediaId: mediaMongoId // Pass ID here too for generic documents
        }
      );
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    
    res.json({ 
      success: true, 
      url: fileUrl, 
      message: 'Tender created and Tax Registry auto-populated' 
    });
  } catch (error) {
    console.error("Upload/Save Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bulk', authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    const { district, type } = req.body;
    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.path, `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`, district, type)
    );
    const urls = await Promise.all(uploadPromises);
    req.files.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });

    // LOG ACTIVITY
    await logActivity(req, 'CREATE', 'MEDIA', `Bulk uploaded ${req.files.length} files`, { urls });

    res.json({ success: true, urls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Edit Agreement & Regenerate Taxes if necessary
 * PUT /api/upload/agreement/:id
 */
router.put('/agreement/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 1. Find the existing tender
    const oldTender = await Tender.findById(id);
    if (!oldTender) return res.status(404).json({ message: "Agreement not found" });

    // 2. Check if financial terms changed
    const termsChanged = 
      oldTender.startDate.toISOString() !== new Date(updateData.startDate).toISOString() ||
      oldTender.endDate.toISOString() !== new Date(updateData.endDate).toISOString() ||
      oldTender.licenseFee !== Number(updateData.licenseFee) ||
      oldTender.taxFrequency !== updateData.taxFrequency;

    // 3. Update the Tender record
    const updatedTender = await Tender.findByIdAndUpdate(id, updateData, { new: true });

    // 4. If terms changed, regenerate installments
    if (termsChanged) {
      // Delete existing UNPAID installments for this tender
      await TaxRecord.deleteMany({ tenderId: id, status: 'Pending' });

      // Generate new installments
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      const annualFee = Number(updateData.licenseFee);
      const newInstallments = [];

      let monthsIncrement = 12;
      if (updateData.taxFrequency === 'Quarterly') monthsIncrement = 3;
      if (updateData.taxFrequency === 'Monthly') monthsIncrement = 1;

      const installmentAmount = (annualFee / (12 / monthsIncrement)).toFixed(2);
      let currentDueDate = new Date(start);

      while (currentDueDate < end) {
        newInstallments.push({
          tenderId: updatedTender._id,
          tenderNumber: updatedTender.tenderNumber,
          district: updatedTender.district,
          area: updatedTender.area,
          amount: Number(installmentAmount),
          dueDate: new Date(currentDueDate),
          status: 'Pending',
          deleted: false
        });
        currentDueDate.setMonth(currentDueDate.getMonth() + monthsIncrement);
      }

      if (newInstallments.length > 0) {
        await TaxRecord.insertMany(newInstallments);
      }
    }

    // LOG ACTIVITY
    const logDesc = termsChanged 
      ? `Updated Agreement Terms & Regenerated Taxes: ${updatedTender.tenderNumber}`
      : `Updated Agreement Details: ${updatedTender.tenderNumber}`;
      
    await logActivity(req, 'UPDATE', 'SYSTEM', logDesc, { tenderId: id });

    res.json({ success: true, message: termsChanged ? "Agreement and Taxes updated" : "Agreement updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;