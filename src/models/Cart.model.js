const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName:  String,
    productImage: String,
    unitPrice:    Number,
    quantity:     { type: Number, min: 1, max: 20, required: true },
    lineTotal:    Number,
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items:           { type: [cartItemSchema], default: [] },
    subtotal:        { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount:  { type: Number, default: 0 },
    deliveryFee:     { type: Number, default: 0 },
    total:           { type: Number, default: 0 },
  },
  { timestamps: true }
);

// user indexed via unique:true

module.exports = mongoose.model('Cart', cartSchema);
