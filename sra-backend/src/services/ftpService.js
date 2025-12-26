const { uploadToFTP } = require('../config/ftp');

/**
 * Bridges files from the Render backend to Hostinger Storage via SFTP
 */
exports.uploadToHostinger = async (localPath, fileName) => {
  try {
    // Try relative pathing: Hostinger SFTP often starts inside the user root or public_html
    // Change from '/public_html/uploads/media/' to 'public_html/uploads/media/'
    const remotePath = `public_html/uploads/media/${fileName}`;
    
    const fileUrl = await uploadToFTP(localPath, remotePath);
    
    return fileUrl;
  } catch (err) {
    console.error("SFTP Upload Bridge Error:", err.message);
    throw new Error("Failed to transfer image to permanent storage.");
  }
};