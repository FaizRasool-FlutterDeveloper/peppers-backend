const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const Admin      = require('../models/Admin.model');
const User       = require('../models/User.model');
const Order      = require('../models/Order.model');
const Offer      = require('../models/Offer.model');
const Banner     = require('../models/Banner.model');
const NotificationLog = require('../models/NotificationLog.model');
const orderService    = require('../services/order.service');
const fcmService      = require('../services/fcm.service');
const uploadService   = require('../services/upload.service');
const dashboardService = require('../services/dashboard.service');
const ApiResponse  = require('../utils/ApiResponse');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginationMeta } = require('../utils/pagination');
const { MAX_LOGIN_ATTEMPTS, LOCK_TIME } = require('../config/constants');

const generateAdminJWT = (adminId) =>
  jwt.sign({ adminId }, process.env.JWT_ADMIN_SECRET, {
    expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '24h',
  });

// ─── Auth ─────────────────────────────────────────────────────────────────────
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password required');

  const admin = await Admin.findOne({ email: email.toLowerCase(), isActive: true });
  if (!admin) throw ApiError.unauthorized('Invalid credentials');

  if (admin.isLocked) throw ApiError.unauthorized('Account temporarily locked. Try again later.');

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    admin.loginAttempts = (admin.loginAttempts || 0) + 1;
    if (admin.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      admin.lockUntil = new Date(Date.now() + LOCK_TIME);
    }
    await admin.save();
    throw ApiError.unauthorized('Invalid credentials');
  }

  admin.loginAttempts = 0;
  admin.lockUntil     = undefined;
  admin.lastLoginAt   = new Date();
  await admin.save();

  const accessToken = generateAdminJWT(admin._id);
  return ApiResponse.success(res, {
    accessToken,
    admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  }, 'Login successful');
});

const adminLogout = asyncHandler(async (req, res) =>
  ApiResponse.success(res, null, 'Logged out'));

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw ApiError.badRequest('Both passwords required');
  if (newPassword.length < 8) throw ApiError.badRequest('Password must be at least 8 characters');

  const admin   = await Admin.findById(req.admin._id);
  const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  await admin.save();
  return ApiResponse.success(res, null, 'Password changed successfully');
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  return ApiResponse.success(res, { stats });
});

const getRevenueChart = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const data = await dashboardService.getRevenueChart(days);
  return ApiResponse.success(res, { data });
});

const getOrdersByType = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOrdersByType();
  return ApiResponse.success(res, { data });
});

const getRecentOrders = asyncHandler(async (req, res) => {
  const limit  = parseInt(req.query.limit) || 10;
  const orders = await dashboardService.getRecentOrders(limit);
  return ApiResponse.success(res, { orders });
});

// ─── Orders ───────────────────────────────────────────────────────────────────
const adminGetOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { status, orderType, search, date } = req.query;

  const filter = {};
  if (status && status !== 'All')        filter.status = status;
  if (orderType && orderType !== 'All')  filter.orderType = orderType;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'customerSnapshot.phoneNumber': { $regex: search, $options: 'i' } },
      { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
    ];
  }
  if (date) {
    const d    = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.createdAt = { $gte: d, $lt: next };
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
    Order.countDocuments(filter),
  ]);
  return ApiResponse.paginated(res, { orders }, paginationMeta(total, page, limit));
});

const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name phoneNumber')
    .select('-__v');
  if (!order) throw ApiError.notFound('Order not found');
  return ApiResponse.success(res, { order });
});

const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await orderService.updateOrderStatus({
    orderId:   req.params.id,
    newStatus: status,
    note,
    adminId:   req.admin._id,
  });
  return ApiResponse.success(res, {
    orderId:          order._id,
    orderNumber:      order.orderNumber,
    status:           order.status,
    notificationSent: true,
  }, `Order updated to ${status}`);
});

// ─── Customers ────────────────────────────────────────────────────────────────
const getCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { search } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { name:        { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ];
  }
  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select('-firebaseUid -fcmTokens -__v'),
    User.countDocuments(filter),
  ]);
  return ApiResponse.paginated(res, { customers }, paginationMeta(total, page, limit));
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id)
    .select('-firebaseUid -fcmTokens -__v');
  if (!customer) throw ApiError.notFound('Customer not found');
  return ApiResponse.success(res, { customer });
});

const getCustomerOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [orders, total] = await Promise.all([
    Order.find({ user: req.params.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ user: req.params.id }),
  ]);
  return ApiResponse.paginated(res, { orders }, paginationMeta(total, page, limit));
});

const toggleBlockCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');
  customer.isBlocked = !customer.isBlocked;
  await customer.save();
  return ApiResponse.success(res, { isBlocked: customer.isBlocked },
    `Customer ${customer.isBlocked ? 'blocked' : 'unblocked'}`);
});

// ─── Offers ───────────────────────────────────────────────────────────────────
const getOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find().sort({ createdAt: -1 });
  return ApiResponse.success(res, { offers });
});

const createOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.create(req.body);
  return ApiResponse.created(res, { offer }, 'Offer created');
});

const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!offer) throw ApiError.notFound('Offer not found');
  return ApiResponse.success(res, { offer }, 'Offer updated');
});

const toggleOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) throw ApiError.notFound('Offer not found');
  offer.isActive = !offer.isActive;
  await offer.save();
  return ApiResponse.success(res, { isActive: offer.isActive });
});

const deleteOffer = asyncHandler(async (req, res) => {
  await Offer.findByIdAndDelete(req.params.id);
  return ApiResponse.success(res, null, 'Offer deleted');
});

// ─── Banners ──────────────────────────────────────────────────────────────────
const getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ sortOrder: 1 });
  return ApiResponse.success(res, { banners });
});

const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  return ApiResponse.created(res, { banner }, 'Banner created');
});

const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) throw ApiError.notFound('Banner not found');
  return ApiResponse.success(res, { banner }, 'Banner updated');
});

const deleteBanner = asyncHandler(async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  return ApiResponse.success(res, null, 'Banner deleted');
});

const reorderBanners = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) throw ApiError.badRequest('Items array required');
  const ops = items.map((item) => ({
    updateOne: { filter: { _id: item.id }, update: { $set: { sortOrder: item.sortOrder } } },
  }));
  await Banner.bulkWrite(ops);
  return ApiResponse.success(res, null, 'Banners reordered');
});

// ─── Notifications ────────────────────────────────────────────────────────────
const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) throw ApiError.badRequest('Title and body required');
  const result = await fcmService.broadcast({ title, body, type: 'promotional', sentBy: req.admin._id });
  return ApiResponse.success(res, result, 'Broadcast sent');
});

const sendNotification = asyncHandler(async (req, res) => {
  const { userId, title, body } = req.body;
  if (!userId || !title || !body) throw ApiError.badRequest('userId, title and body required');
  const result = await fcmService.sendToUser({ userId, title, body, type: 'general', sentBy: req.admin._id });
  return ApiResponse.success(res, result, 'Notification sent');
});

const getNotificationLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [logs, total] = await Promise.all([
    NotificationLog.find().sort({ sentAt: -1 }).skip(skip).limit(limit)
      .populate('targetUser', 'name phoneNumber')
      .populate('sentBy', 'name'),
    NotificationLog.countDocuments(),
  ]);
  return ApiResponse.paginated(res, { logs }, paginationMeta(total, page, limit));
});

// ─── Upload ───────────────────────────────────────────────────────────────────
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Image file required');
  const folder = req.query.folder || 'peppers/products';
  const result = await uploadService.uploadImage(req.file.buffer, folder);
  return ApiResponse.success(res, result, 'Image uploaded');
});

const deleteImage = asyncHandler(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);
  await uploadService.deleteImage(publicId);
  return ApiResponse.success(res, null, 'Image deleted');
});

// ─── Public endpoints ─────────────────────────────────────────────────────────
const getActiveOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({
    isActive: true,
    $or: [{ validUntil: null }, { validUntil: { $gte: new Date() } }],
  }).sort({ createdAt: -1 });
  return ApiResponse.success(res, { offer });
});

const getPublicBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .select('-clickCount -viewCount -__v');
  return ApiResponse.success(res, { banners });
});

module.exports = {
  adminLogin, adminLogout, changePassword,
  getDashboardStats, getRevenueChart, getOrdersByType, getRecentOrders,
  adminGetOrders, adminGetOrder, adminUpdateOrderStatus,
  getCustomers, getCustomer, getCustomerOrders, toggleBlockCustomer,
  getOffers, createOffer, updateOffer, toggleOffer, deleteOffer,
  getBanners, createBanner, updateBanner, deleteBanner, reorderBanners,
  broadcastNotification, sendNotification, getNotificationLogs,
  uploadImage, deleteImage,
  getActiveOffer, getPublicBanners,
};
