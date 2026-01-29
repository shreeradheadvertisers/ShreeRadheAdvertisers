/**
 * Contact/Lead Routes - With Audit Logging
 */

const express = require('express');
const router = express.Router();
const { Contact } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('../services/logger');

// Submit contact form (public - no user to log)
router.post('/', async (req, res) => {
  try {
    console.log("Data received from frontend:", req.body);
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    console.error("DETAILED SUBMISSION ERROR:", error);
    res.status(500).json({ 
      message: 'Failed to submit contact form',
      error: error.message 
    });
  }
});

// Get all contacts (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [contacts, total] = await Promise.all([
      Contact.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Contact.countDocuments(filter)
    ]);

    res.json({ data: contacts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

// Get single contact (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contact' });
  }
});

// Update contact status (protected)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const oldContact = await Contact.findById(req.params.id);
    const contact = await Contact.findByIdAndUpdate(
      req.params.id, 
      { status, notes }, 
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    // LOG ACTIVITY
    await logActivity(
      req, 
      'UPDATE', 
      'CUSTOMER', 
      `Updated Inquiry Status: ${oldContact.name} (${oldContact.status} -> ${status})`, 
      { contactId: contact._id }
    );

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contact status' });
  }
});

// Mark as Attended
router.patch('/:id/attend', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id, 
      { 
        attended: true, 
        attendedAt: new Date(),
        status: 'Contacted' 
      }, 
      { new: true }
    );

    // LOG ACTIVITY
    if (contact) {
      await logActivity(req, 'UPDATE', 'CUSTOMER', `Marked Inquiry as Attended: ${contact.name}`, { contactId: contact._id });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// Revert to unattended
router.patch('/:id/unattend', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id, 
      { 
        attended: false, 
        attendedAt: null,
        status: 'Pending' 
      }, 
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    // LOG ACTIVITY
    await logActivity(req, 'UPDATE', 'CUSTOMER', `Reverted Inquiry to Pending: ${contact.name}`, { contactId: contact._id });

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Revert failed' });
  }
});

module.exports = router;