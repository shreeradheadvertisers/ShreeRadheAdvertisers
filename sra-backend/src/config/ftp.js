/**
 * SFTP Configuration for Hostinger (Port 22)
 * This is more reliable for Render connections.
 */
const Client = require('ssh2-sftp-client');
const path = require('path');

const sftpConfig = {
  host: process.env.FTP_HOST,
  port: 22, // SFTP always uses port 22
  username: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD
};

const uploadToFTP = async (localPath, remotePath) => {
  const sftp = new Client();
  try {
    await sftp.connect(sftpConfig);
    
    // Ensure the remote directory exists
    const remoteDir = path.dirname(remotePath);
    await sftp.mkdir(remoteDir, true);
    
    // Upload the file
    await sftp.put(localPath, remotePath);
    
    console.log(`File uploaded via SFTP: ${remotePath}`);
    const baseUrl = process.env.CDN_BASE_URL || 'https://shreeradheadvertisers.com';
    return `${baseUrl.replace(/\/$/, '')}${remotePath}`;
  } catch (error) {
    console.error('SFTP upload error:', error);
    throw error;
  } finally {
    await sftp.end();
  }
};

const deleteFromFTP = async (remotePath) => {
  const sftp = new Client();
  try {
    await sftp.connect(sftpConfig);
    await sftp.delete(remotePath);
    console.log(`File deleted via SFTP: ${remotePath}`);
  } catch (error) {
    console.error('SFTP delete error:', error);
    throw error;
  } finally {
    await sftp.end();
  }
};

module.exports = { uploadToFTP, deleteFromFTP };