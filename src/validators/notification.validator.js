const Joi = require('joi');

const broadcastSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  body:  Joi.string().min(2).max(500).required(),
});

const sendToUserSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  title:  Joi.string().min(2).max(100).required(),
  body:   Joi.string().min(2).max(500).required(),
});

module.exports = { broadcastSchema, sendToUserSchema };
