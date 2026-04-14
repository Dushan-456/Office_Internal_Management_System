import express from "express";
import Notification from "../models/Notification.mjs";
import { protect } from "../middleware/authMiddleware.mjs";

const router = express.Router();

// @desc    Get all notifications for logged in user
// @route   GET /api/v1/notifications
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @desc    Mark one notification as read
// @route   PATCH /api/v1/notifications/:id/read
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @desc    Mark all notifications as read
// @route   PATCH /api/v1/notifications/read-all
router.patch("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
