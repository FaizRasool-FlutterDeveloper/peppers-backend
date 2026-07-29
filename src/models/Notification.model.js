const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 100 },
    body:  { type: String, required: true, maxlength: 500 },
    type: {
      type: String,
      enum: [
        'order_confirmed','order_preparing','order_out_for_delivery',
        'order_ready_for_pickup','order_delivered','order_cancelled',
        'promotional','general',
      ],
      required: true,
    },
    data: {
      orderId: mongoose.Schema.Types.ObjectId,
      screen:  String,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
