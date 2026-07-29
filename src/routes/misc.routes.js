const express = require('express');

// ─── Offers (public) ──────────────────────────────────────────────────────────
const offerRouter = express.Router();
const { getActiveOffer } = require('../controllers/admin.controller');
offerRouter.get('/active', getActiveOffer);
module.exports.offerRouter = offerRouter;

// ─── Banners (public) ─────────────────────────────────────────────────────────
const bannerRouter = express.Router();
const { getPublicBanners } = require('../controllers/admin.controller');
bannerRouter.get('/', getPublicBanners);
module.exports.bannerRouter = bannerRouter;

// ─── Settings (public) ───────────────────────────────────────────────────────
const settingsRouter = express.Router();
const { getAppSettings } = require('../controllers/settings.controller');
settingsRouter.get('/app', getAppSettings);
module.exports.settingsRouter = settingsRouter;

// ─── Upload (admin) ───────────────────────────────────────────────────────────
const uploadRouter = express.Router();
const { uploadImage, deleteImage }    = require('../controllers/admin.controller');
const { verifyAdminJWT }              = require('../middleware/adminAuth.middleware');
const { uploadMiddleware }            = require('../middleware/upload.middleware');
uploadRouter.post('/image',             verifyAdminJWT, uploadMiddleware.single('image'), uploadImage);
uploadRouter.delete('/image/:publicId', verifyAdminJWT, deleteImage);
module.exports.uploadRouter = uploadRouter;
