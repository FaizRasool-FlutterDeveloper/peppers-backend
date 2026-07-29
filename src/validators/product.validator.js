const Joi = require('joi');

const createProductSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
  price:       Joi.number().min(0).required(),
  categoryId:  Joi.string().hex().length(24).required(),
  image: Joi.object({
    url:      Joi.string().uri().required(),
    publicId: Joi.string().optional().allow(''),
  }).required(),
  isFeatured:  Joi.boolean().optional(),
  isAvailable: Joi.boolean().optional(),
  tags:        Joi.array().items(Joi.string()).optional(),
});

const updateProductSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
  price:       Joi.number().min(0).optional(),
  categoryId:  Joi.string().hex().length(24).optional(),
  image: Joi.object({
    url:      Joi.string().uri().required(),
    publicId: Joi.string().optional().allow(''),
  }).optional(),
  isFeatured:  Joi.boolean().optional(),
  isAvailable: Joi.boolean().optional(),
  tags:        Joi.array().items(Joi.string()).optional(),
});

module.exports = { createProductSchema, updateProductSchema };
