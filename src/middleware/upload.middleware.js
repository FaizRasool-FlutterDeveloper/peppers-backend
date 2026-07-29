const multer  = require('multer');
const ApiError = require('../utils/ApiError');

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('Only image files are allowed'), false);
    }
  },
});

module.exports = { uploadMiddleware };
