const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    name:        { type: String, required: true, trim: true, maxlength: 60 },
    firebaseUid: { type: String, required: true, unique: true },
    fcmTokens:   { type: [String], default: [] },
    isActive:    { type: Boolean, default: true },
    isBlocked:   { type: Boolean, default: false },
    totalOrders: { type: Number, default: 0 },
    totalSpent:  { type: Number, default: 0 },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

// phoneNumber indexed via unique:true
// firebaseUid indexed via unique:true
userSchema.index({ isActive: 1, createdAt: -1 });
userSchema.index({ totalOrders: -1 });

userSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

module.exports = mongoose.model('User', userSchema);
