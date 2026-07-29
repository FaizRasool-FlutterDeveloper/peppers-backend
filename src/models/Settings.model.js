const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key:     { type: String, default: 'global', unique: true },
    isOpen:  { type: Boolean, default: true },
    closedMessage: {
      type:    String,
      default: "We're currently closed. Please check back later.",
    },
    deliveryFee:              { type: Number, default: 15000 },
    minimumOrderAmount:       { type: Number, default: 30000 },
    estimatedDeliveryMinutes: { type: Number, default: 35 },
    restaurantAddress: String,
    restaurantPhone:   String,
    restaurantEmail:   String,
    appVersion: {
      android:     String,
      forceUpdate: Boolean,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

// key indexed via unique:true

module.exports = mongoose.model('Settings', settingsSchema);
