import Notification from "../models/Notification.js";
import User from "../models/User.js";

// =====================================================
// USER: GET NOTIFICATIONS
// =====================================================

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const notifications = await Notification.find({
      userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch notifications.",
    });
  }
};

// =====================================================
// USER: MARK ONE AS READ
// =====================================================

export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("MARK NOTIFICATION ERROR:", error);

    return res.status(500).json({
      error: "Failed to update notification.",
    });
  }
};

// =====================================================
// USER: MARK ALL AS READ
// =====================================================

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    await Notification.updateMany(
      {
        userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      error: "Failed to update notifications.",
    });
  }
};

// =====================================================
// ADMIN: CREATE NOTIFICATION
//
// target:
// "all"  → send to every user
// "user" → send to one specific user
// =====================================================

export const createAdminNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type = "system",
      target = "all",
      userId,
      orderId,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!title || !message) {
      return res.status(400).json({
        error: "Title and message are required.",
      });
    }

    if (!["order", "offer", "system"].includes(type)) {
      return res.status(400).json({
        error: "Invalid notification type.",
      });
    }

    // -------------------------------------------------
    // SEND TO ONE USER
    // -------------------------------------------------

    if (target === "user") {
      if (!userId) {
        return res.status(400).json({
          error: "User ID is required.",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      const notification = await Notification.create({
        userId: user._id,
        title,
        message,
        type,
        orderId: orderId || null,
      });

      return res.status(201).json({
        success: true,
        message: "Notification sent to user.",
        notification,
      });
    }

    // -------------------------------------------------
    // SEND TO ALL USERS
    // -------------------------------------------------

    if (target === "all") {
      const users = await User.find({}).select("_id");

      if (users.length === 0) {
        return res.status(404).json({
          error: "No users found.",
        });
      }

      const notifications = users.map((user) => ({
        userId: user._id,
        title,
        message,
        type,
        orderId: orderId || null,
      }));

      await Notification.insertMany(notifications);

      return res.status(201).json({
        success: true,
        message: "Notification sent to all users.",
        usersNotified: users.length,
      });
    }

    // -------------------------------------------------
    // INVALID TARGET
    // -------------------------------------------------

    return res.status(400).json({
      error: "Target must be 'all' or 'user'.",
    });

  } catch (error) {
    console.error("CREATE ADMIN NOTIFICATION ERROR:", error);

    return res.status(500).json({
      error: "Failed to create notification.",
    });
  }
};