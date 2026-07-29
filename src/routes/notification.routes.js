const express = require('express');
const router  = express.Router();

const { getNotifications, markRead, markAllRead, getUnreadCount } =
  require('../controllers/notification.controller');
const { verifyUserJWT } = require('../middleware/auth.middleware');

router.use(verifyUserJWT);
router.get('/',             getNotifications);
router.patch('/read-all',   markAllRead);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read',   markRead);

module.exports = router;
