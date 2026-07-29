const Joi = require('joi');

const offerSchema = Joi.object({
  type:          Joi.string().valid('launch_discount', 'free_delivery', 'custom').required(),
  name:          Joi.string().min(2).max(100).required(),
  description:   Joi.string().optional().allow(''),
  discountType:  Joi.string().valid('percentage', 'fixed').default('percentage'),
  discountValue: Joi.number().min(0).max(100).default(0),
  freeDelivery:  Joi.boolean().default(false),
  isActive:      Joi.boolean().default(false),
  validFrom:     Joi.date().optional(),
  validUntil:    Joi.date().optional(),
  appliesTo:     Joi.string().valid('all_orders', 'delivery_only', 'first_order').default('all_orders'),
});

module.exports = { offerSchema };
