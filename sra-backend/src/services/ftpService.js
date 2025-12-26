const ftp = require("basic-ftp");
const fs = require("fs");

/**
 * Bridges files from the Render backend to Hostinger Storage
 */
exports.uploadToHostinger = async (localPath, fileName) => {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === 'true'
    });

    // Ensure directory exists on Hostinger
    await client.ensureDir("/public_html/uploads/media");
    
    // Upload file
    await client.uploadFrom(localPath, `/public_html/uploads/media/${fileName}`);
    
    // Return the final public URL for MongoDB storage
    return `${process.env.CDN_BASE_URL}/media/${fileName}`;
  } catch (err) {
    console.error("FTP Upload Bridge Error:", err);
    throw err;
  } finally {
    client.close();
  }
};