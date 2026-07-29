const Cart     = require('../models/Cart.model');
const Product  = require('../models/Product.model');
const Offer    = require('../models/Offer.model');
const Settings = require('../models/Settings.model');
const ApiError = require('../utils/ApiError');
const { calculateCartTotals } = require('../utils/priceCalculator');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const recalculateCart = async (cart) => {
  const [settings, offer] = await Promise.all([
    Settings.findOne({ key: 'global' }),
    Offer.findOne({ isActive: true }).sort({ createdAt: -1 }),
  ]);
  const deliveryFee = settings?.deliveryFee ?? 15000;
  const totals = calculateCartTotals(cart.items, offer, deliveryFee);
  Object.assign(cart, totals);
  return cart;
};

const addItem = async (userId, productId, quantity) => {
  const product = await Product.findOne({ _id: productId, isDeleted: false, isAvailable: true });
  if (!product) throw ApiError.notFound('Product not available');

  const cart       = await getOrCreateCart(userId);
  const existingIdx = cart.items.findIndex((i) => i.product.toString() === productId);

  if (existingIdx >= 0) {
    const newQty = cart.items[existingIdx].quantity + quantity;
    if (newQty > 20) throw ApiError.badRequest('Maximum quantity is 20');
    cart.items[existingIdx].quantity  = newQty;
    cart.items[existingIdx].lineTotal = product.price * newQty;
  } else {
    cart.items.push({
      product:      product._id,
      productName:  product.name,
      productImage: product.image.url,
      unitPrice:    product.price,
      quantity,
      lineTotal:    product.price * quantity,
    });
  }

  await recalculateCart(cart);
  await cart.save();
  return cart;
};

const updateItem = async (userId, productId, quantity) => {
  if (quantity < 1)  throw ApiError.badRequest('Quantity must be at least 1');
  if (quantity > 20) throw ApiError.badRequest('Maximum quantity is 20');

  const cart = await getOrCreateCart(userId);
  const idx  = cart.items.findIndex((i) => i.product.toString() === productId);
  if (idx < 0) throw ApiError.notFound('Item not in cart');

  const product = await Product.findById(productId).select('price');
  cart.items[idx].quantity  = quantity;
  cart.items[idx].lineTotal = (product?.price || cart.items[idx].unitPrice) * quantity;

  await recalculateCart(cart);
  await cart.save();
  return cart;
};

const removeItem = async (userId, productId) => {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await recalculateCart(cart);
  await cart.save();
  return cart;
};

const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.items           = [];
  cart.subtotal        = 0;
  cart.discountAmount  = 0;
  cart.discountPercent = 0;
  cart.deliveryFee     = 0;
  cart.total           = 0;
  await cart.save();
  return cart;
};

module.exports = { getOrCreateCart, recalculateCart, addItem, updateItem, removeItem, clearCart };
