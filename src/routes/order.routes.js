const express = require('express');
const router  = express.Router();

const { placeOrder, getOrders, getActiveOrders, getOrder, cancelOrder } =
  require('../controllers/order.controller');
const { verifyUserJWT }  = require('../middleware/auth.middleware');
const { validate }       = require('../middleware/validate.middleware');
const { orderRateLimiter } = require('../middleware/rateLimiter.middleware');
const { placeOrderSchema } = require('../validators/order.validator');

router.use(verifyUserJWT);
router.post('/',            orderRateLimiter, validate(placeOrderSchema), placeOrder);
router.get('/',             getOrders);
router.get('/active',       getActiveOrders);
router.get('/:id',          getOrder);
router.patch('/:id/cancel', cancelOrder);

module.exports = router;
