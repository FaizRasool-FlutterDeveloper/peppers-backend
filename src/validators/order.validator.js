const Joi = require('joi');

const placeOrderSchema = Joi.object({
  idempotencyKey: Joi.string().required(),
  orderType: Joi.string().valid('delivery', 'takeaway', 'dine_in').required(),
  deliveryAddress: Joi.when('orderType', {
    is: 'delivery',
    then: Joi.object({
      label:       Joi.string().optional().allow(''),
      addressLine: Joi.string().required(),
      coordinates: Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required(),
      }).required(),
      googlePlaceId: Joi.string().optional().allow(''),
    }).required(),
    otherwise: Joi.optional(),
  }),
  notes:         Joi.string().max(300).optional().allow(''),
  paymentMethod: Joi.string().valid('cod').default('cod'),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered', 'cancelled')
    .required(),
  note: Joi.string().max(200).optional().allow(''),
});

module.exports = { placeOrderSchema, updateStatusSchema };
