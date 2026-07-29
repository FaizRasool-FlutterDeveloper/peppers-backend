const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name:         { type: String, required: true },
    role:         { type: String, enum: ['superadmin','manager','staff'], default: 'staff' },
    isActive:     { type: Boolean, default: true },
    lastLoginAt:  Date,
    loginAttempts:{ type: Number, default: 0 },
    lockUntil:    Date,
  },
  { timestamps: true }
);

// email indexed via unique:true
adminSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

module.exports = mongoose.model('Admin', adminSchema);
