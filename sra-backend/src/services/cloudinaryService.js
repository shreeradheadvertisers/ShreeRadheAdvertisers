const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Optimized Media Upload for Shree Radhe Advertisers
 * Connects directly to the 'Explore Media' page performance
 */
exports.uploadToCloudinary = async (localPath, customId, district = 'General', type = 'media') => {
  try {
    // FIX: Trim whitespace from parameters to prevent "public_id must not end with whitespace" error
    const cleanId = String(customId).trim();
    const cleanDistrict = String(district).trim();
    
    const folderPath = `ShreeRadhe/Districts/${cleanDistrict}/${type === 'media' ? 'Images' : 'Documents'}`;
    
    const result = await cloudinary.uploader.upload(localPath, {
      public_id: cleanId, // Use the trimmed customId
      folder: folderPath,
      resource_type: 'auto',
      
      // 1. INCOMING TRANSFORMATION: 
      // Limits the 'Master' image to 2000px. This prevents storing massive 10MB files
      // and ensures the high-res version in the 'Details View' is already optimized.
      transformation: [
        { width: 2000, crop: "limit" }, 
        { quality: "auto", fetch_format: "auto" }
      ],

      // 2. EAGER TRANSFORMATIONS: 
      // Pre-generates the exact version used in the Explore Media grid.
      // This is the 'secret sauce' for instant page loads.
      eager: [
        { 
          width: 800, 
          height: 600, 
          crop: "fill", 
          gravity: "auto", 
          quality: "auto", 
          fetch_format: "auto" 
        }
      ],
      
      // Process the eager version in the background so the admin upload doesn't stall
      eager_async: true 
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Error:', error);
    throw new Error(`Cloudinary transfer failed: ${error.message}`);
  }
};