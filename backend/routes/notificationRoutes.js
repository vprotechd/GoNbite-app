import express from "express";

import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// USER NOTIFICATIONS
// =====================================================

router.get("/", authMiddleware, getUserNotifications);

router.patch(
  "/:id/read",
  authMiddleware,
  markNotificationAsRead
);

router.patch(
  "/read-all",
  authMiddleware,
  markAllNotificationsAsRead
);

export default router;