const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  targetType:       { type: String, enum: ['single','broadcast'], required: true },
  targetUser:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title:            String,
  body:             String,
  fcmTokens:        [String],
  successCount:     Number,
  failureCount:     Number,
  fcmResponse:      mongoose.Schema.Types.Mixed,
  sentBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  relatedOrder:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  notificationType: String,
  sentAt:           { type: Date, default: Date.now },
});

notificationLogSchema.index({ sentAt: -1 });
notificationLogSchema.index({ targetType: 1, sentAt: -1 });
notificationLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
