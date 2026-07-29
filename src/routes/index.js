const express = require('express');
const router  = express.Router();

const { offerRouter, bannerRouter, settingsRouter, uploadRouter } =
  require('./misc.routes');

router.use('/auth',          require('./auth.routes'));
router.use('/users',         require('./user.routes'));
router.use('/addresses',     require('./address.routes'));
router.use('/categories',    require('./category.routes'));
router.use('/products',      require('./product.routes'));
router.use('/cart',          require('./cart.routes'));
router.use('/orders',        require('./order.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/offers',        offerRouter);
router.use('/banners',       bannerRouter);
router.use('/settings',      settingsRouter);
router.use('/upload',        uploadRouter);
router.use('/admin',         require('./admin.routes'));

module.exports = router;
