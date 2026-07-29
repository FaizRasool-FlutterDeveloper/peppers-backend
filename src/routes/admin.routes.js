const express = require('express');
const router  = express.Router();

const adminCtrl    = require('../controllers/admin.controller');
const settingsCtrl = require('../controllers/settings.controller');
const productCtrl  = require('../controllers/product.controller');
const categoryCtrl = require('../controllers/category.controller');

const { verifyAdminJWT }     = require('../middleware/adminAuth.middleware');
const { validate }           = require('../middleware/validate.middleware');
const { uploadMiddleware }   = require('../middleware/upload.middleware');
const { updateStatusSchema } = require('../validators/order.validator');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');
const { createCategorySchema, updateCategorySchema, reorderSchema } =
  require('../validators/category.validator');
const { broadcastSchema, sendToUserSchema } = require('../validators/notification.validator');
const { updateSettingsSchema }              = require('../validators/settings.validator');

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login',            adminCtrl.adminLogin);
router.post('/auth/logout',           verifyAdminJWT, adminCtrl.adminLogout);
router.patch('/auth/change-password', verifyAdminJWT, adminCtrl.changePassword);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard/stats',         verifyAdminJWT, adminCtrl.getDashboardStats);
router.get('/dashboard/revenue-chart', verifyAdminJWT, adminCtrl.getRevenueChart);
router.get('/dashboard/orders-by-type',verifyAdminJWT, adminCtrl.getOrdersByType);
router.get('/dashboard/recent-orders', verifyAdminJWT, adminCtrl.getRecentOrders);

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get('/orders',              verifyAdminJWT, adminCtrl.adminGetOrders);
router.get('/orders/:id',          verifyAdminJWT, adminCtrl.adminGetOrder);
router.patch('/orders/:id/status', verifyAdminJWT, validate(updateStatusSchema), adminCtrl.adminUpdateOrderStatus);

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products',                  verifyAdminJWT, productCtrl.adminGetProducts);
router.post('/products',                 verifyAdminJWT, validate(createProductSchema), productCtrl.createProduct);
router.put('/products/:id',              verifyAdminJWT, validate(updateProductSchema), productCtrl.updateProduct);
router.delete('/products/:id',           verifyAdminJWT, productCtrl.deleteProduct);
router.patch('/products/:id/availability',verifyAdminJWT, productCtrl.toggleAvailability);
router.patch('/products/:id/featured',   verifyAdminJWT, productCtrl.toggleFeatured);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories',              verifyAdminJWT, categoryCtrl.adminGetCategories);
router.post('/categories',             verifyAdminJWT, validate(createCategorySchema), categoryCtrl.createCategory);
router.put('/categories/:id',          verifyAdminJWT, validate(updateCategorySchema), categoryCtrl.updateCategory);
router.delete('/categories/:id',       verifyAdminJWT, categoryCtrl.deleteCategory);
router.patch('/categories/reorder',    verifyAdminJWT, validate(reorderSchema),        categoryCtrl.reorderCategories);
router.patch('/categories/:id/toggle', verifyAdminJWT, categoryCtrl.toggleVisibility);

// ─── Customers ────────────────────────────────────────────────────────────────
router.get('/customers',              verifyAdminJWT, adminCtrl.getCustomers);
router.get('/customers/:id',          verifyAdminJWT, adminCtrl.getCustomer);
router.get('/customers/:id/orders',   verifyAdminJWT, adminCtrl.getCustomerOrders);
router.patch('/customers/:id/block',  verifyAdminJWT, adminCtrl.toggleBlockCustomer);

// ─── Offers ───────────────────────────────────────────────────────────────────
router.get('/offers',              verifyAdminJWT, adminCtrl.getOffers);
router.post('/offers',             verifyAdminJWT, adminCtrl.createOffer);
router.put('/offers/:id',          verifyAdminJWT, adminCtrl.updateOffer);
router.patch('/offers/:id/toggle', verifyAdminJWT, adminCtrl.toggleOffer);
router.delete('/offers/:id',       verifyAdminJWT, adminCtrl.deleteOffer);

// ─── Banners ──────────────────────────────────────────────────────────────────
router.get('/banners',              verifyAdminJWT, adminCtrl.getBanners);
router.post('/banners',             verifyAdminJWT, adminCtrl.createBanner);
router.put('/banners/:id',          verifyAdminJWT, adminCtrl.updateBanner);
router.delete('/banners/:id',       verifyAdminJWT, adminCtrl.deleteBanner);
router.patch('/banners/reorder',    verifyAdminJWT, adminCtrl.reorderBanners);

// ─── Notifications ────────────────────────────────────────────────────────────
router.post('/notifications/broadcast', verifyAdminJWT, validate(broadcastSchema),   adminCtrl.broadcastNotification);
router.post('/notifications/send',      verifyAdminJWT, validate(sendToUserSchema),  adminCtrl.sendNotification);
router.get('/notifications/logs',       verifyAdminJWT, adminCtrl.getNotificationLogs);

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings', verifyAdminJWT, settingsCtrl.getAdminSettings);
router.put('/settings', verifyAdminJWT, validate(updateSettingsSchema), settingsCtrl.updateSettings);

// ─── Upload ───────────────────────────────────────────────────────────────────
router.post('/upload/image',             verifyAdminJWT, uploadMiddleware.single('image'), adminCtrl.uploadImage);
router.delete('/upload/image/:publicId', verifyAdminJWT, adminCtrl.deleteImage);

module.exports = router;
