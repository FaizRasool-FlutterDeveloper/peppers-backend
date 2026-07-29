const Joi = require('joi');

const addressSchema = Joi.object({
  label:       Joi.string().valid('home', 'office', 'other').default('home'),
  customLabel: Joi.string().max(30).optional().allow(''),
  addressLine: Joi.string().min(5).max(300).required(),
  coordinates: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
  googlePlaceId: Joi.string().optional().allow(''),
  isDefault:     Joi.boolean().optional(),
});

module.exports = { addressSchema };
