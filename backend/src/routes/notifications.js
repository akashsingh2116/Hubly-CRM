import express from "express";
import Notification from "../models/Notification.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// GET /api/notifications?page=1&limit=20&unreadOnly=false
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { page = "1", limit = "20", unreadOnly } = req.query;
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, parseInt(limit) || 20);

    const query = { userId: req.user.id };
    if (unreadOnly === "true") query.isRead = false;

    const [notifs, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user.id, isRead: false }),
    ]);

    res.json({
      notifications: notifs,
      unreadCount,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) { next(err); }
});

// GET /api/notifications/unread-count
router.get("/unread-count", authRequired, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ count });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", authRequired, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true }
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", authRequired, async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
