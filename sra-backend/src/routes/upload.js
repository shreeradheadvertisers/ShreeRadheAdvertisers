/**
 * Upload Routes - FTP Bridge to Hostinger 100GB SSD
 */

const express = require('express');
const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const { upload } = require('../middleware/upload');
const { uploadToHostinger } = require('../services/ftpService');
const { authMiddleware } = require('../middleware/auth');

/**
 * General File Upload
 * Bridges any file from Render temp storage to Hostinger public_html/uploads
 */
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const localPath = req.file.path;
    const folder = req.body.folder || 'documents';
    
    // Create a unique filename with timestamp to prevent overwriting on Hostinger
    const fileName = `${folder}-${Date.now()}${path.extname(req.file.originalname)}`;
    
    // Bridge to Hostinger via the updated service
    const fileUrl = await uploadToHostinger(localPath, fileName);
    
    // Clean up local temp file on Render to save disk space
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    
    res.json({ 
      success: true, 
      url: fileUrl, 
      filename: fileName,
      message: 'File successfully bridged to Hostinger permanent storage' 
    });
  } catch (error) {
    console.error('Upload bridge error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'File deployment failed during FTP transfer' 
    });
  }
});

/**
 * Specialized Image Upload
 * Optimized specifically for Media/Billboard photography
 */
router.post('/image', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const localPath = req.file.path;
    
    // Standardized naming convention for media assets
    const fileName = `media-${Date.now()}${path.extname(req.file.originalname)}`;
    
    // Deploy to Hostinger public_html/uploads/media
    const fileUrl = await uploadToHostinger(localPath, fileName);
    
    // Cleanup local buffer
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    
    res.json({ 
      success: true, 
      url: fileUrl, 
      filename: fileName,
      message: 'Billboard photography successfully deployed to permanent storage'
    });
  } catch (error) {
    console.error('Image deployment bridge error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Image deployment failed' 
    });
  }
});

module.exports = router;