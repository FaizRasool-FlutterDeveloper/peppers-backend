/**
 * All monetary values in PAISAS (integer arithmetic)
 * PKR 1 = 100 paisas  |  e.g. PKR 450 = 45000 paisas
 */
const calculateCartTotals = (items, offer, deliveryFee) => {
  const subtotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

  let discountPercent  = 0;
  let discountAmount   = 0;
  let finalDeliveryFee = deliveryFee || 0;

  if (offer && offer.isActive) {
    if (offer.discountType === 'percentage' && offer.discountValue > 0) {
      discountPercent = offer.discountValue;
      discountAmount  = Math.floor((subtotal * discountPercent) / 100);
    } else if (offer.discountType === 'fixed' && offer.discountValue > 0) {
      discountAmount = Math.min(offer.discountValue, subtotal);
    }
    if (offer.freeDelivery) finalDeliveryFee = 0;
  }

  const total = Math.max(0, subtotal - discountAmount + finalDeliveryFee);
  return { subtotal, discountPercent, discountAmount, deliveryFee: finalDeliveryFee, total };
};

module.exports = { calculateCartTotals };
