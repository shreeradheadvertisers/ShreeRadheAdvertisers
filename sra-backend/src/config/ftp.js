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
    // 1. Pass a 0 timeout to disable control socket timeouts during transfer
    const client = new ftp.Client(0); 
    client.ftp.verbose = true;
    
    try {
        // 2. Disable NAT traversal issues common on Render
        client.ftp.allowSeparateTransferHost = false; 

        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            port: 21,
            secure: false, // TLS handshakes often cause timeouts in cloud envs
            timeout: 90000 // 90 second global timeout
        });

        client.ftp.pasv = true;

        const remoteDir = path.dirname(remotePath);
        await client.ensureDir(remoteDir);

        // 3. Fast upload directly from stream
        await client.uploadFrom(localPath, path.basename(remotePath));

        const baseUrl = process.env.CDN_BASE_URL || 'https://shreeradheadvertisers.com';
        const webPath = remotePath.replace('public_html/', '');
        return `${baseUrl.replace(/\/$/, '')}/${webPath.replace(/^\//, '')}`;
    } catch (error) {
        console.error('FTP Error:', error.message);
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