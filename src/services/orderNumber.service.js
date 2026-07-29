const Counter = require('../models/Counter.model');

const generateOrderNumber = async () => {
  const today   = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const key     = `orders_${dateStr}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const sequence = String(counter.seq).padStart(4, '0');
  return `PEP-${dateStr}-${sequence}`;
};

module.exports = { generateOrderNumber };
