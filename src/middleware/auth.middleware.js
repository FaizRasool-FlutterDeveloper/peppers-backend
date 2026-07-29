const jwt        = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError   = require('../utils/ApiError');
const User       = require('../models/User.model');

const verifyUserJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw ApiError.unauthorized('Access token required');

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(decoded.userId).select('-__v');
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or suspended');
  if (user.isBlocked)          throw ApiError.forbidden('Account has been suspended');

  req.user = user;
  next();
});

module.exports = { verifyUserJWT };
