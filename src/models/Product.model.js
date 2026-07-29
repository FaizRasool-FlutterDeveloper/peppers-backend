const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true, maxlength: 100 },
    slug:         { type: String, required: true, unique: true, lowercase: true },
    description:  { type: String, maxlength: 500, default: '' },
    price:        { type: Number, required: true, min: 0 },
    category:     { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    image: {
      url:      { type: String, required: true },
      publicId: String,
    },
    isFeatured:   { type: Boolean, default: false },
    isAvailable:  { type: Boolean, default: true },
    isDeleted:    { type: Boolean, default: false },
    tags:         { type: [String], default: [] },
    totalOrdered: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// slug indexed via unique:true
productSchema.index({ category: 1, isAvailable: 1, isDeleted: 1 });
productSchema.index({ isFeatured: 1, isDeleted: 1 });
productSchema.index({ isDeleted: 1, isAvailable: 1 });
productSchema.index({ totalOrdered: -1 });
productSchema.index(
  { name: 'text', description: 'text', tags: 'text', categoryName: 'text' },
  { weights: { name: 10, tags: 5, categoryName: 3, description: 1 }, name: 'product_text_search' }
);

module.exports = mongoose.model('Product', productSchema);
