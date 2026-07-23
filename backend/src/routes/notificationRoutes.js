import express from "express";
import {
  getNotifications,
  readNotification,
  closeNotificationController,
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET /api/notifications
 */
router.get("/", authMiddleware, getNotifications);

/**
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", authMiddleware, readNotification);

/**
 * PATCH /api/notifications/:id/close
 */
router.patch("/:id/close", authMiddleware, closeNotificationController);

export default router;