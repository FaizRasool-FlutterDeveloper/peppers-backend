const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName:  { type: String, required: true },
    productImage: String,
    categoryName: String,
    unitPrice:    { type: Number, required: true },
    quantity:     { type: Number, required: true, min: 1 },
    lineTotal:    { type: Number, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status:    String,
    timestamp: { type: Date, default: Date.now },
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerSnapshot: {
      name:        String,
      phoneNumber: String,
    },
    orderType: {
      type:     String,
      enum:     ['delivery', 'takeaway', 'dine_in'],
      required: true,
    },
    items: { type: [orderItemSchema], required: true },
    pricing: {
      subtotal:        { type: Number, required: true },
      discountPercent: { type: Number, default: 0 },
      discountAmount:  { type: Number, default: 0 },
      deliveryFee:     { type: Number, default: 0 },
      total:           { type: Number, required: true },
    },
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending','collected','failed'], default: 'pending' },
    deliveryAddress: {
      label:         String,
      addressLine:   String,
      coordinates:   { lat: Number, lng: Number },
      googlePlaceId: String,
    },
    status: {
      type:    String,
      enum:    ['pending','confirmed','preparing','out_for_delivery','ready_for_pickup','delivered','cancelled'],
      default: 'pending',
    },
    statusHistory:  { type: [statusHistorySchema], default: [] },
    cancellation: {
      cancelledBy: { type: String, enum: ['customer','admin'] },
      reason:      String,
      cancelledAt: Date,
    },
    notes:                    { type: String, maxlength: 300, default: '' },
    estimatedDeliveryMinutes: Number,
    idempotencyKey:           { type: String, unique: true },
  },
  { timestamps: true }
);

// orderNumber indexed via unique:true
// idempotencyKey indexed via unique:true
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderType: 1, status: 1 });
orderSchema.index({ 'customerSnapshot.phoneNumber': 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Order', orderSchema);
