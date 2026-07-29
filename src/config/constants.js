module.exports = {
  ORDER_STATUSES: [
    'pending','confirmed','preparing',
    'out_for_delivery','ready_for_pickup',
    'delivered','cancelled',
  ],
  TERMINAL_STATUSES:    ['delivered','cancelled'],
  CANCELLABLE_STATUSES: ['pending'],

  STATUS_TRANSITIONS: {
    pending:          ['confirmed','cancelled'],
    confirmed:        ['preparing','cancelled'],
    preparing:        ['out_for_delivery','ready_for_pickup','cancelled'],
    out_for_delivery: ['delivered'],
    ready_for_pickup: ['delivered'],
    delivered:        [],
    cancelled:        [],
  },

  FCM_MESSAGES: {
    order_confirmed: {
      title: '✅ Order Confirmed!',
      body:  "Your order has been confirmed. We're getting it ready!",
    },
    order_preparing: {
      title: '👨‍🍳 Preparing Your Order',
      body:  'Our kitchen is preparing your delicious order!',
    },
    order_out_for_delivery: {
      title: '🛵 Order On Its Way!',
      body:  'Your rider has picked up your order and is heading your way.',
    },
    order_ready_for_pickup: {
      title: '✅ Order Ready!',
      body:  'Your order is ready for pickup at Peppers.',
    },
    order_delivered: {
      title: '🎉 Order Delivered!',
      body:  'Your order has been delivered. Enjoy your meal!',
    },
    order_cancelled: {
      title: '❌ Order Cancelled',
      body:  'Your order has been cancelled.',
    },
  },

  MAX_ADDRESSES_PER_USER: 5,
  JWT_EXPIRES_IN:         '7d',
  JWT_ADMIN_EXPIRES_IN:   '24h',
  MAX_LOGIN_ATTEMPTS:     5,
  LOCK_TIME:              30 * 60 * 1000, // 30 minutes
};
