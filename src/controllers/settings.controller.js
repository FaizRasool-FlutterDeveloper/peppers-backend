const Settings   = require('../models/Settings.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/settings/app  — PUBLIC
const getAppSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: 'global' }).select('-updatedBy -__v');
  if (!settings) settings = await Settings.create({ key: 'global' });
  return ApiResponse.success(res, { settings });
});

// GET /api/v1/admin/settings  — ADMIN
const getAdminSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) settings = await Settings.create({ key: 'global' });
  return ApiResponse.success(res, { settings });
});

// PUT /api/v1/admin/settings  — ADMIN
const updateSettings = asyncHandler(async (req, res) => {
  const {
    isOpen, closedMessage, deliveryFee, minimumOrderAmount,
    estimatedDeliveryMinutes, restaurantAddress, restaurantPhone,
    restaurantEmail, appVersion,
  } = req.body;

  const update = { updatedBy: req.admin._id };
  if (isOpen !== undefined)                update.isOpen = isOpen;
  if (closedMessage)                       update.closedMessage = closedMessage;
  if (deliveryFee !== undefined)           update.deliveryFee = Math.round(Number(deliveryFee) * 100);
  if (minimumOrderAmount !== undefined)    update.minimumOrderAmount = Math.round(Number(minimumOrderAmount) * 100);
  if (estimatedDeliveryMinutes !== undefined) update.estimatedDeliveryMinutes = Number(estimatedDeliveryMinutes);
  if (restaurantAddress !== undefined)     update.restaurantAddress = restaurantAddress;
  if (restaurantPhone !== undefined)       update.restaurantPhone = restaurantPhone;
  if (restaurantEmail !== undefined)       update.restaurantEmail = restaurantEmail;
  if (appVersion !== undefined)            update.appVersion = appVersion;

  const settings = await Settings.findOneAndUpdate(
    { key: 'global' }, update, { upsert: true, new: true }
  );
  return ApiResponse.success(res, { settings }, 'Settings updated');
});

module.exports = { getAppSettings, getAdminSettings, updateSettings };
