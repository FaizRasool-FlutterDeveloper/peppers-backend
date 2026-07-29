const cartService  = require('../services/cart.service');
const ApiResponse  = require('../utils/ApiResponse');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getOrCreateCart(req.user._id);
  return ApiResponse.success(res, { cart });
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) throw ApiError.badRequest('Product ID required');
  const cart = await cartService.addItem(req.user._id, productId, Number(quantity));
  return ApiResponse.success(res, { cart }, 'Item added to cart');
});

const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined) throw ApiError.badRequest('Quantity required');
  const cart = await cartService.updateItem(req.user._id, req.params.productId, Number(quantity));
  return ApiResponse.success(res, { cart }, 'Cart updated');
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.params.productId);
  return ApiResponse.success(res, { cart }, 'Item removed');
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  return ApiResponse.success(res, { cart }, 'Cart cleared');
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
