const express = require('express');
const router  = express.Router();

const {
  getProducts, getFeaturedProducts, searchProducts, getProductsByCategory,
  getProduct, createProduct, updateProduct, deleteProduct,
  toggleAvailability, toggleFeatured,
} = require('../controllers/product.controller');
const { verifyAdminJWT } = require('../middleware/adminAuth.middleware');
const { validate }       = require('../middleware/validate.middleware');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');

// Public
router.get('/',                     getProducts);
router.get('/featured',             getFeaturedProducts);
router.get('/search',               searchProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id',                  getProduct);

// Admin protected
router.post('/',                  verifyAdminJWT, validate(createProductSchema), createProduct);
router.put('/:id',                verifyAdminJWT, validate(updateProductSchema), updateProduct);
router.delete('/:id',             verifyAdminJWT, deleteProduct);
router.patch('/:id/availability', verifyAdminJWT, toggleAvailability);
router.patch('/:id/featured',     verifyAdminJWT, toggleFeatured);

module.exports = router;
