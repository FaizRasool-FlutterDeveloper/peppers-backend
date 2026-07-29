const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true, maxlength: 50 },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, maxlength: 200, default: '' },
    image: {
      url:      String,
      publicId: String,
    },
    sortOrder:    { type: Number, default: 0 },
    isVisible:    { type: Boolean, default: true },
    isDeleted:    { type: Boolean, default: false },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// slug indexed via unique:true
categorySchema.index({ isVisible: 1, sortOrder: 1 });
categorySchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Category', categorySchema);
