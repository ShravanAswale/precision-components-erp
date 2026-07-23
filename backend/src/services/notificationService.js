import Notification from "../models/Notification.js";

// Create Notification
export const createNotification = async ({
  type,
  title,
  message,
  priority = "Medium",
  relatedId = null,
  relatedModel = null,
  dueDate = null,
  createdBy = null,
}) => {
  // Prevent duplicate active notifications
  const existing = await Notification.findOne({
    type,
    relatedId,
    title,
    isClosed: false,
  });

  if (existing) {
    return existing;
  }

  return await Notification.create({
    type,
    title,
    message,
    priority,
    relatedId,
    relatedModel,
    dueDate,
    createdBy,
  });
};

// Get Active Notifications
export const getActiveNotifications = async () => {
  return await Notification.find({
    isClosed: false,
  })
    .sort({
      priority: -1,
      createdAt: -1,
    })
    .populate("createdBy", "fullName");
};

// Get Notification Count
export const getNotificationCount = async () => {
  return await Notification.countDocuments({
    isClosed: false,
  });
};

// Mark Notification as Read
export const markAsRead = async (id) => {
  return await Notification.findByIdAndUpdate(
    id,
    {
      isRead: true,
    },
    {
      new: true,
    }
  );
};

// Close Notification
export const closeNotification = async (id, userId = null) => {
  return await Notification.findByIdAndUpdate(
    id,
    {
      isClosed: true,
      closedAt: new Date(),
      closedBy: userId,
    },
    {
      new: true,
    }
  );
};