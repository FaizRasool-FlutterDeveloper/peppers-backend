const admin          = require('../config/firebase');
const Notification   = require('../models/Notification.model');
const NotificationLog = require('../models/NotificationLog.model');
const User           = require('../models/User.model');
const logger         = require('../utils/logger');

// ─── Send to single user ──────────────────────────────────────────────────────
const sendToUser = async ({ userId, title, body, type, data = {}, orderId = null, sentBy = null }) => {
  try {
    const user = await User.findById(userId).select('fcmTokens');
    if (!user || !user.fcmTokens.length) {
      logger.warn(`No FCM tokens for user ${userId}`);
      return { success: false, reason: 'no_tokens' };
    }

    // Save in-app notification
    await Notification.create({
      user:  userId,
      title,
      body,
      type,
      data: {
        orderId: orderId || undefined,
        screen:  orderId ? 'order_detail' : 'home',
      },
    });

    // Build FCM payload
    const message = {
      notification: { title, body },
      data: {
        type,
        screen:  orderId ? 'order_detail' : 'home',
        orderId: orderId ? orderId.toString() : '',
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      },
      android: {
        notification: {
          sound:     'default',
          priority:  'high',
          channelId: 'peppers_orders',
        },
        priority: 'high',
      },
      tokens: user.fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Remove invalid tokens
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code;
        if (code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(user.fcmTokens[idx]);
        }
      }
    });
    if (invalidTokens.length) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { $in: invalidTokens } },
      });
    }

    // Log
    await NotificationLog.create({
      targetType:       'single',
      targetUser:       userId,
      title, body,
      fcmTokens:        user.fcmTokens,
      successCount:     response.successCount,
      failureCount:     response.failureCount,
      fcmResponse:      { successCount: response.successCount, failureCount: response.failureCount },
      sentBy,
      relatedOrder:     orderId,
      notificationType: type,
    });

    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (err) {
    logger.error('FCM sendToUser error:', err);
    return { success: false, reason: err.message };
  }
};

// ─── Broadcast to all users ───────────────────────────────────────────────────
const broadcast = async ({ title, body, type = 'promotional', data = {}, sentBy = null }) => {
  try {
    const users = await User.find(
      { isActive: true, isBlocked: false, 'fcmTokens.0': { $exists: true } },
      { _id: 1, fcmTokens: 1 }
    );
    if (!users.length) return { success: true, sent: 0 };

    const allTokens = users.flatMap((u) => u.fcmTokens);
    const batchSize = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < allTokens.length; i += batchSize) {
      const batch   = allTokens.slice(i, i + batchSize);
      const message = {
        notification: { title, body },
        data: {
          type, screen: 'home',
          ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        },
        android: { notification: { sound: 'default', channelId: 'peppers_general' } },
        tokens: batch,
      };
      const response = await admin.messaging().sendEachForMulticast(message);
      totalSuccess += response.successCount;
      totalFailure += response.failureCount;
    }

    // Bulk in-app notifications
    const notifDocs = users.map((u) => ({
      user: u._id, title, body, type, data: { screen: 'home' },
    }));
    await Notification.insertMany(notifDocs, { ordered: false });

    await NotificationLog.create({
      targetType:       'broadcast',
      title, body,
      fcmTokens:        allTokens,
      successCount:     totalSuccess,
      failureCount:     totalFailure,
      sentBy,
      notificationType: type,
    });

    return { success: true, sent: totalSuccess, failed: totalFailure };
  } catch (err) {
    logger.error('FCM broadcast error:', err);
    return { success: false, reason: err.message };
  }
};

module.exports = { sendToUser, broadcast };
