const Notification  = require('../models/Notification.model');
const ApiResponse   = require('../utils/ApiResponse');
const asyncHandler  = require('../utils/asyncHandler');
const { paginate, paginationMeta } = require('../utils/pagination');

const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [notifications, total] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: req.user._id }),
  ]);
  return ApiResponse.paginated(res, { notifications }, paginationMeta(total, page, limit));
});

const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, { isRead: true }
  );
  return ApiResponse.success(res, null, 'Marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false }, { isRead: true }
  );
  return ApiResponse.success(res, null, 'All marked as read');
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return ApiResponse.success(res, { count });
});

module.exports = { getNotifications, markRead, markAllRead, getUnreadCount };
