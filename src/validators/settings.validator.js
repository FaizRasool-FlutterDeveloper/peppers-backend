const Joi = require('joi');

const updateSettingsSchema = Joi.object({
  isOpen:                   Joi.boolean().optional(),
  closedMessage:            Joi.string().max(200).optional().allow(''),
  deliveryFee:              Joi.number().min(0).optional(),
  minimumOrderAmount:       Joi.number().min(0).optional(),
  estimatedDeliveryMinutes: Joi.number().min(1).max(120).optional(),
  restaurantAddress:        Joi.string().optional().allow(''),
  restaurantPhone:          Joi.string().optional().allow(''),
  restaurantEmail:          Joi.string().email().optional().allow(''),
});

module.exports = { updateSettingsSchema };
