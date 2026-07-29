const Joi = require('joi');

const verifyOtpSchema = Joi.object({
  idToken:  Joi.string().required(),
  fcmToken: Joi.string().optional().allow(''),
});

const setupProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
});

module.exports = { verifyOtpSchema, setupProfileSchema };
