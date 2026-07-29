const express = require('express');
const router  = express.Router();

const { verifyOtp, setupProfile, logout, refreshFcm } = require('../controllers/auth.controller');
const { verifyFirebaseToken }  = require('../middleware/firebaseAuth.middleware');
const { verifyUserJWT }        = require('../middleware/auth.middleware');
const { validate }             = require('../middleware/validate.middleware');
const { authRateLimiter }      = require('../middleware/rateLimiter.middleware');
const { verifyOtpSchema, setupProfileSchema } = require('../validators/auth.validator');

router.post('/verify-otp',    authRateLimiter, verifyFirebaseToken, verifyOtp);
router.post('/setup-profile', verifyUserJWT, validate(setupProfileSchema), setupProfile);
router.post('/logout',        verifyUserJWT, logout);
router.post('/refresh-fcm',   verifyUserJWT, refreshFcm);

module.exports = router;
