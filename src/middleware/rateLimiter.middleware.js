const rateLimit = require('express-rate-limit');

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again in 10 minutes.' },
});

const orderRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many order requests.' },
});

module.exports = { globalRateLimiter, authRateLimiter, orderRateLimiter };
