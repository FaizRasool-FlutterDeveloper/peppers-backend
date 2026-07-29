const admin      = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError   = require('../utils/ApiError');

const verifyFirebaseToken = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) throw ApiError.badRequest('Firebase ID token required');

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = { uid: decoded.uid, phone: decoded.phone_number };
    next();
  } catch (err) {
    throw ApiError.unauthorized('Invalid Firebase token');
  }
});

module.exports = { verifyFirebaseToken };
