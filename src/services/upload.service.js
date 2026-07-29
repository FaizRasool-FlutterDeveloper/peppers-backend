const cloudinary   = require('../config/cloudinary');
const streamifier  = require('streamifier');
const ApiError     = require('../utils/ApiError');

const uploadImage = (fileBuffer, folder = 'peppers/products') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_bytes: 5 * 1024 * 1024,
      },
      (error, result) => {
        if (error) return reject(ApiError.internal('Image upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
};

module.exports = { uploadImage, deleteImage };
