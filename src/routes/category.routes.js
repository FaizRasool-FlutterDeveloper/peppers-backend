const express = require('express');
const router  = express.Router();

const {
  getCategories, getCategory, createCategory, updateCategory,
  deleteCategory, reorderCategories, toggleVisibility,
} = require('../controllers/category.controller');
const { verifyAdminJWT } = require('../middleware/adminAuth.middleware');
const { validate }       = require('../middleware/validate.middleware');
const { createCategorySchema, updateCategorySchema, reorderSchema } =
  require('../validators/category.validator');

// Public
router.get('/',    getCategories);
router.get('/:id', getCategory);

// Admin protected
router.post('/',            verifyAdminJWT, validate(createCategorySchema), createCategory);
router.put('/:id',          verifyAdminJWT, validate(updateCategorySchema), updateCategory);
router.delete('/:id',       verifyAdminJWT, deleteCategory);
router.patch('/reorder',    verifyAdminJWT, validate(reorderSchema),        reorderCategories);
router.patch('/:id/toggle', verifyAdminJWT, toggleVisibility);

module.exports = router;
