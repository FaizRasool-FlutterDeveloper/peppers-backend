const Address    = require('../models/Address.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError   = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { MAX_ADDRESSES_PER_USER } = require('../config/constants');

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id, isDeleted: false })
    .sort({ isDefault: -1, createdAt: -1 });
  return ApiResponse.success(res, { addresses });
});

const addAddress = asyncHandler(async (req, res) => {
  const count = await Address.countDocuments({ user: req.user._id, isDeleted: false });
  if (count >= MAX_ADDRESSES_PER_USER) {
    throw ApiError.badRequest(`Maximum ${MAX_ADDRESSES_PER_USER} addresses allowed`);
  }

  const { label, customLabel, addressLine, coordinates, googlePlaceId, isDefault } = req.body;

  if (isDefault) {
    await Address.updateMany(
      { user: req.user._id, isDeleted: false }, { $set: { isDefault: false } }
    );
  }

  const address = await Address.create({
    user: req.user._id, label, customLabel, addressLine,
    coordinates, googlePlaceId, isDefault: !!isDefault,
  });
  return ApiResponse.created(res, { address }, 'Address added');
});

const updateAddress = asyncHandler(async (req, res) => {
  const { label, customLabel, addressLine, coordinates, googlePlaceId, isDefault } = req.body;

  if (isDefault) {
    await Address.updateMany(
      { user: req.user._id, isDeleted: false }, { $set: { isDefault: false } }
    );
  }

  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, isDeleted: false },
    { label, customLabel, addressLine, coordinates, googlePlaceId, isDefault },
    { new: true }
  );
  if (!address) throw ApiError.notFound('Address not found');
  return ApiResponse.success(res, { address }, 'Address updated');
});

const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, isDeleted: false },
    { isDeleted: true, isDefault: false },
    { new: true }
  );
  if (!address) throw ApiError.notFound('Address not found');
  return ApiResponse.success(res, null, 'Address removed');
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  await Address.updateMany(
    { user: req.user._id, isDeleted: false }, { $set: { isDefault: false } }
  );
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, isDeleted: false },
    { isDefault: true },
    { new: true }
  );
  if (!address) throw ApiError.notFound('Address not found');
  return ApiResponse.success(res, { address }, 'Default address set');
});

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress };
