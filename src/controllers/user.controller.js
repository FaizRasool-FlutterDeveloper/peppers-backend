const User       = require('../models/User.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError   = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-fcmTokens -firebaseUid -__v');
  return ApiResponse.success(res, { user });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) throw ApiError.badRequest('Name is required');

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name.trim() },
    { new: true }
  ).select('-fcmTokens -firebaseUid -__v');

  return ApiResponse.success(res, { user }, 'Profile updated');
});

const deleteMe = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  return ApiResponse.success(res, null, 'Account deactivated');
});

module.exports = { getMe, updateMe, deleteMe };
