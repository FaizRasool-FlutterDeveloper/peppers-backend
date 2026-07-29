const Product    = require('../models/Product.model');
const Category   = require('../models/Category.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError   = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginationMeta } = require('../utils/pagination');
const { slugify } = require('../utils/slugify');

const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { category, available } = req.query;
  const filter = { isDeleted: false };
  if (category)            filter.category = category;
  if (available !== undefined) filter.isAvailable = available === 'true';

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ totalOrdered: -1, createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
    Product.countDocuments(filter),
  ]);
  return ApiResponse.paginated(res, { products }, paginationMeta(total, page, limit));
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isDeleted: false, isAvailable: true })
    .sort({ totalOrdered: -1 })
    .limit(10)
    .select('-__v');
  return ApiResponse.success(res, { products });
});

const searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) throw ApiError.badRequest('Search query required');

  const products = await Product.find(
    { $text: { $search: q }, isDeleted: false },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(20)
    .select('-__v');

  return ApiResponse.success(res, { products, query: q });
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { category: req.params.categoryId, isDeleted: false };

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ totalOrdered: -1 }).skip(skip).limit(limit).select('-__v'),
    Product.countDocuments(filter),
  ]);
  return ApiResponse.paginated(res, { products }, paginationMeta(total, page, limit));
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
    .populate('category', 'name slug')
    .select('-__v');
  if (!product) throw ApiError.notFound('Product not found');
  return ApiResponse.success(res, { product });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, categoryId, image, isFeatured, isAvailable, tags } = req.body;

  const category = await Category.findOne({ _id: categoryId, isDeleted: false });
  if (!category) throw ApiError.notFound('Category not found');

  // Price stored in paisas
  const priceInPaisas = Math.round(Number(price) * 100);
  const slug = slugify(name);

  const product = await Product.create({
    name, slug,
    description: description || '',
    price:        priceInPaisas,
    category:     categoryId,
    categoryName: category.name,
    image,
    isFeatured:   !!isFeatured,
    isAvailable:  isAvailable !== false,
    tags:         tags || [],
  });

  await Category.findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } });
  return ApiResponse.created(res, { product }, 'Product created');
});

const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, categoryId, image, isFeatured, isAvailable, tags } = req.body;
  const update = {};

  if (name !== undefined)        { update.name = name; update.slug = slugify(name); }
  if (description !== undefined) update.description = description;
  if (price !== undefined)       update.price = Math.round(Number(price) * 100);
  if (image !== undefined)       update.image = image;
  if (isFeatured !== undefined)  update.isFeatured = isFeatured;
  if (isAvailable !== undefined) update.isAvailable = isAvailable;
  if (tags !== undefined)        update.tags = tags;

  if (categoryId) {
    const category = await Category.findOne({ _id: categoryId, isDeleted: false });
    if (!category) throw ApiError.notFound('Category not found');
    update.category     = categoryId;
    update.categoryName = category.name;
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false }, update, { new: true }
  );
  if (!product) throw ApiError.notFound('Product not found');
  return ApiResponse.success(res, { product }, 'Product updated');
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true }
  );
  if (!product) throw ApiError.notFound('Product not found');
  await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
  return ApiResponse.success(res, null, 'Product deleted');
});

const toggleAvailability = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
  if (!product) throw ApiError.notFound('Product not found');
  product.isAvailable = !product.isAvailable;
  await product.save();
  return ApiResponse.success(res, { isAvailable: product.isAvailable });
});

const toggleFeatured = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
  if (!product) throw ApiError.notFound('Product not found');
  product.isFeatured = !product.isFeatured;
  await product.save();
  return ApiResponse.success(res, { isFeatured: product.isFeatured });
});

// Admin: get all products including unavailable
const adminGetProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { search, category }  = req.query;
  const filter = { isDeleted: false };
  if (category) filter.category = category;
  if (search)   filter.$or = [
    { name:        { $regex: search, $options: 'i' } },
    { categoryName:{ $regex: search, $options: 'i' } },
  ];

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
    Product.countDocuments(filter),
  ]);
  return ApiResponse.paginated(res, { products }, paginationMeta(total, page, limit));
});

module.exports = {
  getProducts, getFeaturedProducts, searchProducts, getProductsByCategory,
  getProduct, createProduct, updateProduct, deleteProduct,
  toggleAvailability, toggleFeatured, adminGetProducts,
};
