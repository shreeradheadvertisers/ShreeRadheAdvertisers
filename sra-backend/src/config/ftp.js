const ftp = require("basic-ftp");
const path = require("path");

// Increased timeout to 90 seconds for production stability
const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: 21,
    secure: false, 
    timeout: 90000, //
    settings: {
        retries: 5, // Increased retries for transient network issues
        retryDelay: 5000
    }
};

/**
 * Uploads a file using standard FTP
 */
const uploadToFTP = async (localPath, remotePath) => {
    // Pass the timeout directly to the client constructor
    const client = new ftp.Client(90000); 
    client.ftp.verbose = true;
    
    try {
        console.log('=== FTP Upload Debug ===');
        console.log('Local file:', localPath);
        console.log('Remote path requested:', remotePath);

        // Required for NAT environments like Render to avoid socket mismatch
        client.ftp.allowSeparateTransferHost = false; 

        await client.access(ftpConfig);
        console.log('FTP connected successfully');

        // Explicitly enable Passive Mode for production firewalls
        client.ftp.pasv = true;

        // Ensure the remote directory exists
        const remoteDir = path.dirname(remotePath);
        console.log('Ensuring directory exists:', remoteDir);
        await client.ensureDir(remoteDir);

        // Upload the file
        await client.uploadFrom(localPath, path.basename(remotePath));
        console.log(`File uploaded successfully to: ${remotePath}`);

        // Build public URL logic
        const baseUrl = process.env.CDN_BASE_URL || 'https://shreeradheadvertisers.com';
        
        // Strip public_html and handle slashes for the public URL
        const webPath = remotePath.replace('public_html/', '');
        const finalUrl = `${baseUrl.replace(/\/$/, '')}/${webPath.replace(/^\//, '')}`;
        
        console.log('Generated URL:', finalUrl);

        return finalUrl;
    } catch (error) {
        console.error('FTP upload error:', error.message);
        throw error;
    } finally {
        client.close();
    }
};

/**
 * Deletes a file using standard FTP
 */
const deleteFromFTP = async (remotePath) => {
    const client = new ftp.Client(90000);
    try {
        await client.access(ftpConfig);
        await client.remove(remotePath);
        console.log(`File deleted via FTP: ${remotePath}`);
    } catch (error) {
        console.error('FTP delete error:', error.message);
        throw error;
    } finally {
        client.close();
    }
};

module.exports = { uploadToFTP, deleteFromFTP };