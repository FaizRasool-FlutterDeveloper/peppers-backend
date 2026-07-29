const Category   = require('../models/Category.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError   = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { slugify } = require('../utils/slugify');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isDeleted: false, isVisible: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select('-__v');
  return ApiResponse.success(res, { categories });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, isDeleted: false }).select('-__v');
  if (!category) throw ApiError.notFound('Category not found');
  return ApiResponse.success(res, { category });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, sortOrder } = req.body;
  const slug = slugify(name);

  const category = await Category.create({
    name, slug, description: description || '', image, sortOrder: sortOrder ?? 0,
  });
  return ApiResponse.created(res, { category }, 'Category created');
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, image, sortOrder, isVisible } = req.body;
  const update = {};
  if (name !== undefined)        { update.name = name; update.slug = slugify(name); }
  if (description !== undefined) update.description = description;
  if (image !== undefined)       update.image = image;
  if (sortOrder !== undefined)   update.sortOrder = sortOrder;
  if (isVisible !== undefined)   update.isVisible = isVisible;

  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false }, update, { new: true }
  );
  if (!category) throw ApiError.notFound('Category not found');
  return ApiResponse.success(res, { category }, 'Category updated');
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
  );
  if (!category) throw ApiError.notFound('Category not found');
  return ApiResponse.success(res, null, 'Category deleted');
});

const reorderCategories = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) throw ApiError.badRequest('Items array required');

  const ops = items.map((item) => ({
    updateOne: { filter: { _id: item.id }, update: { $set: { sortOrder: item.sortOrder } } },
  }));
  await Category.bulkWrite(ops);
  return ApiResponse.success(res, null, 'Categories reordered');
});

const toggleVisibility = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
  if (!category) throw ApiError.notFound('Category not found');
  category.isVisible = !category.isVisible;
  await category.save();
  return ApiResponse.success(res, { isVisible: category.isVisible });
});

// Admin: get all categories including hidden
const adminGetCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isDeleted: false })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select('-__v');
  return ApiResponse.success(res, { categories });
});

module.exports = {
  getCategories, getCategory, createCategory, updateCategory,
  deleteCategory, reorderCategories, toggleVisibility, adminGetCategories,
};
