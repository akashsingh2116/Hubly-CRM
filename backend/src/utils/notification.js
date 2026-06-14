import Notification from "../models/Notification.js";
import { getIO } from "../socket/index.js";
import logger from "./logger.js";

/**
 * Create a notification for a user and push it via socket if possible.
 */
export async function createNotification({ userId, type, title, body = "", link = "", data = {} }) {
  try {
    const notif = await Notification.create({ userId, type, title, body, link, data });

    // Push to the user's socket room (user:<id>)
    getIO()?.to(`user:${userId}`).emit("notification", {
      id:        notif._id,
      type:      notif.type,
      title:     notif.title,
      body:      notif.body,
      link:      notif.link,
      isRead:    false,
      createdAt: notif.createdAt,
    });

    return notif;
  } catch (err) {
    logger.error(`createNotification failed: ${err.message}`);
    return null;
  }
}
