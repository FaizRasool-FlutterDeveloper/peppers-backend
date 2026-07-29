const Order        = require('../models/Order.model');
const orderService = require('../services/order.service');
const ApiResponse  = require('../utils/ApiResponse');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginationMeta } = require('../utils/pagination');

// POST /api/v1/orders
const placeOrder = asyncHandler(async (req, res) => {
  const { orderType, deliveryAddress, notes, idempotencyKey } = req.body;
  if (!idempotencyKey) throw ApiError.badRequest('Idempotency key required');
  if (!orderType)      throw ApiError.badRequest('Order type required');

  const order = await orderService.placeOrder({
    userId: req.user._id, orderType, deliveryAddress, notes, idempotencyKey,
  });
  return ApiResponse.created(res, { order }, 'Order placed successfully');
});

// GET /api/v1/orders
const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
    Order.countDocuments({ user: req.user._id }),
  ]);
  return ApiResponse.paginated(res, { orders }, paginationMeta(total, page, limit));
});

// GET /api/v1/orders/active
const getActiveOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user:   req.user._id,
    status: { $in: ['pending','confirmed','preparing','out_for_delivery','ready_for_pickup'] },
  }).sort({ createdAt: -1 }).select('-__v');
  return ApiResponse.success(res, { orders });
});

// GET /api/v1/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).select('-__v');
  if (!order) throw ApiError.notFound('Order not found');
  return ApiResponse.success(res, { order });
});

// PATCH /api/v1/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrderByCustomer({
    orderId: req.params.id, userId: req.user._id,
  });
  return ApiResponse.success(res, { order }, 'Order cancelled');
});

module.exports = { placeOrder, getOrders, getActiveOrders, getOrder, cancelOrder };
