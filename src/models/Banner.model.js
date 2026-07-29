const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, maxlength: 100 },
    image: {
      url:      { type: String, required: true },
      publicId: String,
    },
    linkType:   { type: String, enum: ['product','category','offer','none'], default: 'none' },
    linkTarget: String,
    sortOrder:  { type: Number, default: 0 },
    isActive:   { type: Boolean, default: true },
    viewCount:  { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
