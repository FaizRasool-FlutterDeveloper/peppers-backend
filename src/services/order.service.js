const Order    = require('../models/Order.model');
const Cart     = require('../models/Cart.model');
const User     = require('../models/User.model');
const Settings = require('../models/Settings.model');
const Offer    = require('../models/Offer.model');
const { generateOrderNumber }  = require('./orderNumber.service');
const { sendToUser }           = require('./fcm.service');
const { calculateCartTotals }  = require('../utils/priceCalculator');
const ApiError  = require('../utils/ApiError');
const logger    = require('../utils/logger');
const { STATUS_TRANSITIONS, CANCELLABLE_STATUSES, FCM_MESSAGES } = require('../config/constants');

// ─── Place Order ──────────────────────────────────────────────────────────────
const placeOrder = async ({ userId, orderType, deliveryAddress, notes, idempotencyKey }) => {
  // Idempotency check — return existing order if duplicate request
  const existing = await Order.findOne({ idempotencyKey });
  if (existing) return existing;

  // Validate cart
  const cart = await Cart.findOne({ user: userId });
  if (!cart || !cart.items.length) throw ApiError.badRequest('Cart is empty');

  // Check restaurant is open
  const settings = await Settings.findOne({ key: 'global' });
  if (settings && !settings.isOpen) throw ApiError.badRequest('Restaurant is currently closed');

  // Delivery address required for delivery orders
  if (orderType === 'delivery' && !deliveryAddress?.addressLine) {
    throw ApiError.badRequest('Delivery address is required for delivery orders');
  }

  // Recalculate pricing server-side — never trust client prices
  const offer       = await Offer.findOne({ isActive: true }).sort({ createdAt: -1 });
  const deliveryFee = orderType === 'delivery' ? (settings?.deliveryFee ?? 15000) : 0;
  const pricing     = calculateCartTotals(cart.items, offer, deliveryFee);

  // Minimum order check
  if (settings?.minimumOrderAmount && pricing.total < settings.minimumOrderAmount) {
    const minPKR = (settings.minimumOrderAmount / 100).toFixed(0);
    throw ApiError.badRequest(`Minimum order amount is PKR ${minPKR}`);
  }

  const user        = await User.findById(userId).select('name phoneNumber');
  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    user:    userId,
    customerSnapshot: { name: user.name, phoneNumber: user.phoneNumber },
    orderType,
    items: cart.items.map((i) => ({
      product:      i.product,
      productName:  i.productName,
      productImage: i.productImage,
      unitPrice:    i.unitPrice,
      quantity:     i.quantity,
      lineTotal:    i.lineTotal,
    })),
    pricing,
    deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
    notes:           notes || '',
    estimatedDeliveryMinutes: settings?.estimatedDeliveryMinutes ?? 35,
    idempotencyKey,
    statusHistory: [{ status: 'pending', timestamp: new Date() }],
  });

  // Clear cart after order placed
  await Cart.findOneAndUpdate(
    { user: userId },
    { items: [], subtotal: 0, discountAmount: 0, discountPercent: 0, deliveryFee: 0, total: 0 }
  );

  // Increment user order count
  await User.findByIdAndUpdate(userId, { $inc: { totalOrders: 1 } });

  logger.info(`Order placed: ${orderNumber} | User: ${userId} | Total: ${pricing.total}`);
  return order;
};

// ─── Update Order Status (Admin) ──────────────────────────────────────────────
const updateOrderStatus = async ({ orderId, newStatus, note, adminId }) => {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const allowed = STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Cannot change status from '${order.status}' to '${newStatus}'`
    );
  }

  order.status = newStatus;
  order.statusHistory.push({
    status:    newStatus,
    timestamp: new Date(),
    note:      note || '',
    updatedBy: adminId,
  });

  // On delivery — collect payment and update user total spend
  if (newStatus === 'delivered') {
    order.paymentStatus = 'collected';
    await User.findByIdAndUpdate(order.user, {
      $inc: { totalSpent: order.pricing.total },
    });
  }

  // On cancellation — log reason
  if (newStatus === 'cancelled') {
    order.cancellation = {
      cancelledBy: 'admin',
      reason:      note || '',
      cancelledAt: new Date(),
    };
    // Revert order count
    await User.findByIdAndUpdate(order.user, { $inc: { totalOrders: -1 } });
  }

  await order.save();

  // Send push notification to customer
  const fcmKey    = `order_${newStatus}`;
  const fcmConfig = FCM_MESSAGES[fcmKey];
  if (fcmConfig) {
    await sendToUser({
      userId:  order.user,
      title:   fcmConfig.title,
      body:    fcmConfig.body,
      type:    fcmKey,
      orderId: order._id,
      sentBy:  adminId,
    });
  }

  logger.info(`Order ${order.orderNumber} → ${newStatus} by admin ${adminId}`);
  return order;
};

// ─── Cancel Order (Customer) ──────────────────────────────────────────────────
const cancelOrderByCustomer = async ({ orderId, userId }) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw ApiError.notFound('Order not found');

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw ApiError.badRequest('Order cannot be cancelled at this stage');
  }

  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', timestamp: new Date() });
  order.cancellation = { cancelledBy: 'customer', cancelledAt: new Date() };

  await order.save();
  await User.findByIdAndUpdate(userId, { $inc: { totalOrders: -1 } });

  return order;
};

module.exports = { placeOrder, updateOrderStatus, cancelOrderByCustomer };
