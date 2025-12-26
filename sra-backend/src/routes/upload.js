/**
 * Upload Routes - FTP Bridge to Hostinger 100GB SSD
 */

const express = require('express');
const router = express.Router();
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
    // Create a unique filename to prevent overwriting on Hostinger
    const fileName = `${folder}-${Date.now()}${path.extname(req.file.originalname)}`;
    
    // Bridge to Hostinger
    const fileUrl = await uploadToHostinger(localPath, fileName);
    
    // Clean up temp file on Render
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    
    res.json({ 
      success: true, 
      url: fileUrl, 
      filename: fileName,
      message: 'File bridged to Hostinger successfully' 
    });
  } catch (error) {
    console.error('Upload bridge error:', error);
    res.status(500).json({ success: false, message: 'File upload failed during FTP transfer' });
  }
});

/**
 * Specialized Image Upload
 * Specifically for Media/Billboard images
 */
router.post('/image', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const localPath = req.file.path;
    // Standardized naming for media assets
    const fileName = `media-${Date.now()}${path.extname(req.file.originalname)}`;
    
    // Bridge to Hostinger
    const fileUrl = await uploadToHostinger(localPath, fileName);
    
    // Clean up temp file on Render
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    
    res.json({ 
      success: true, 
      url: fileUrl, 
      filename: fileName,
      message: 'Image successfully deployed to permanent storage'
    });
  } catch (error) {
    console.error('Image upload bridge error:', error);
    res.status(500).json({ success: false, message: 'Image deployment failed' });
  }
});

module.exports = router;