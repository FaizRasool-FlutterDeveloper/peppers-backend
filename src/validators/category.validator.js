const Joi = require('joi');

const createCategorySchema = Joi.object({
  name:        Joi.string().trim().min(2).max(50).required(),
  description: Joi.string().max(200).optional().allow(''),
  image: Joi.object({
    url:      Joi.string().uri().optional().allow(''),
    publicId: Joi.string().optional().allow(''),
  }).optional(),
  sortOrder: Joi.number().optional(),
  isVisible: Joi.boolean().optional(),
});

const updateCategorySchema = Joi.object({
  name:        Joi.string().trim().min(2).max(50).optional(),
  description: Joi.string().max(200).optional().allow(''),
  image: Joi.object({
    url:      Joi.string().uri().optional().allow(''),
    publicId: Joi.string().optional().allow(''),
  }).optional(),
  sortOrder: Joi.number().optional(),
  isVisible: Joi.boolean().optional(),
});

const reorderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      id:        Joi.string().hex().length(24).required(),
      sortOrder: Joi.number().required(),
    })
  ).required(),
});

module.exports = { createCategorySchema, updateCategorySchema, reorderSchema };
