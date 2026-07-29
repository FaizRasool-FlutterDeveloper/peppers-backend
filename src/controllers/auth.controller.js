const jwt        = require('jsonwebtoken');
const admin      = require('../config/firebase');
const User       = require('../models/User.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError   = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const generateUserJWT = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/v1/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { idToken, fcmToken } = req.body;

  const decoded = await admin.auth().verifyIdToken(idToken);
  const { uid, phone_number: phoneNumber } = decoded;

  if (!phoneNumber) throw ApiError.badRequest('Phone number not found in token');

  let user      = await User.findOne({ firebaseUid: uid });
  const isNewUser = !user;

  if (isNewUser) {
    user = await User.create({
      firebaseUid: uid,
      phoneNumber,
      name:        'Guest',
      fcmTokens:   fcmToken ? [fcmToken] : [],
      lastLoginAt: new Date(),
    });
  } else {
    const updateData = { lastLoginAt: new Date() };
    if (fcmToken && !user.fcmTokens.includes(fcmToken)) {
      updateData.$addToSet = { fcmTokens: fcmToken };
    }
    user = await User.findByIdAndUpdate(user._id, updateData, { new: true });
  }

  if (user.isBlocked) throw ApiError.forbidden('Account has been suspended');

  const accessToken = generateUserJWT(user._id);

  return ApiResponse.success(res, {
    accessToken,
    isNewUser,
    user: { _id: user._id, name: user.name, phoneNumber: user.phoneNumber },
  }, isNewUser ? 'Registration successful' : 'Login successful');
});

// POST /api/v1/auth/setup-profile
const setupProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) throw ApiError.badRequest('Name is required');

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name.trim() },
    { new: true }
  ).select('-fcmTokens -firebaseUid -__v');

  return ApiResponse.success(res, { user }, 'Profile setup successful');
});

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (fcmToken) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { fcmTokens: fcmToken } });
  }
  return ApiResponse.success(res, null, 'Logged out successfully');
});

// POST /api/v1/auth/refresh-fcm
const refreshFcm = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) throw ApiError.badRequest('FCM token required');

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { fcmTokens: fcmToken } });
  return ApiResponse.success(res, null, 'FCM token updated');
});

module.exports = { verifyOtp, setupProfile, logout, refreshFcm };
