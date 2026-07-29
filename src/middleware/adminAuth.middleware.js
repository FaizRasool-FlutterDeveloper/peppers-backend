const jwt        = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError   = require('../utils/ApiError');
const Admin      = require('../models/Admin.model');

const verifyAdminJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw ApiError.unauthorized('Admin token required');

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired admin token');
  }

  const admin = await Admin.findById(decoded.adminId).select('-passwordHash -__v');
  if (!admin || !admin.isActive) throw ApiError.unauthorized('Admin account not found');

  req.admin = admin;
  next();
});

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.admin?.role)) throw ApiError.forbidden('Insufficient permissions');
  next();
};

module.exports = { verifyAdminJWT, requireRole };
