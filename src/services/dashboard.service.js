const Order = require('../models/Order.model');
const User  = require('../models/User.model');

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDashboardStats = async () => {
  const today    = getStartOfDay();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayStats, activeOrders, pendingOrders, totalCustomers] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$pricing.total' }, avgOrderValue: { $avg: '$pricing.total' } } },
    ]),
    Order.countDocuments({ status: { $in: ['confirmed','preparing','out_for_delivery','ready_for_pickup'] } }),
    Order.countDocuments({ status: 'pending' }),
    User.countDocuments({ isActive: true }),
  ]);

  const s = todayStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
  return {
    todayOrders:   s.totalOrders,
    todayRevenue:  Math.round(s.totalRevenue),
    avgOrderValue: Math.round(s.avgOrderValue || 0),
    activeOrders,
    pendingOrders,
    totalCustomers,
  };
};

const getRevenueChart = async (days = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, status: { $nin: ['cancelled'] } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const result = [];
  for (let i = 0; i < days; i++) {
    const d       = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const found   = data.find((r) => r._id === dateStr);
    result.push({
      date:    dateStr,
      label:   d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: found ? Math.round(found.revenue) : 0,
      orders:  found ? found.orders : 0,
    });
  }
  return result;
};

const getOrdersByType = async () => {
  const today = getStartOfDay();
  const data  = await Order.aggregate([
    { $match: { createdAt: { $gte: today }, status: { $nin: ['cancelled'] } } },
    { $group: { _id: '$orderType', count: { $sum: 1 } } },
  ]);
  return {
    delivery: data.find((d) => d._id === 'delivery')?.count ?? 0,
    takeaway: data.find((d) => d._id === 'takeaway')?.count ?? 0,
    dine_in:  data.find((d) => d._id === 'dine_in')?.count  ?? 0,
  };
};

const getRecentOrders = async (limit = 10) => {
  return Order.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('orderNumber customerSnapshot orderType pricing status createdAt items')
    .lean();
};

module.exports = { getDashboardStats, getRevenueChart, getOrdersByType, getRecentOrders };
