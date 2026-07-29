const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label:       { type: String, enum: ['home','office','other'], default: 'home' },
    customLabel: { type: String, maxlength: 30 },
    addressLine: { type: String, required: true, maxlength: 300 },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    googlePlaceId: String,
    isDefault:     { type: Boolean, default: false },
    isDeleted:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.index({ user: 1, isDeleted: 1 });
addressSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model('Address', addressSchema);
