const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    type: {
      type:     String,
      enum:     ['launch_discount','free_delivery','custom'],
      required: true,
    },
    name:        { type: String, required: true },
    description: String,
    discountType: { type: String, enum: ['percentage','fixed'], default: 'percentage' },
    discountValue:{ type: Number, default: 0 },
    freeDelivery: { type: Boolean, default: false },
    isActive:     { type: Boolean, default: false },
    validFrom:    Date,
    validUntil:   Date,
    appliesTo: {
      type:    String,
      enum:    ['all_orders','delivery_only','first_order'],
      default: 'all_orders',
    },
  },
  { timestamps: true }
);

offerSchema.index({ isActive: 1, type: 1 });

module.exports = mongoose.model('Offer', offerSchema);
