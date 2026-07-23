import {
  getActiveNotifications,
  getNotificationCount,
  markAsRead,
  closeNotification,
} from "../services/notificationService.js";

/**
 * GET /api/v1/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await getActiveNotifications();
    const notificationCount = await getNotificationCount();

    res.status(200).json({
      success: true,
      data: notifications,
      notificationCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 */
export const readNotification = async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id);

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PATCH /api/v1/notifications/:id/close
 */
export const closeNotificationController = async (req, res) => {
  try {
    const notification = await closeNotification(
      req.params.id,
      req.user?._id || null
    );

    res.status(200).json({
      success: true,
      message: "Notification closed successfully.",
      data: notification,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};