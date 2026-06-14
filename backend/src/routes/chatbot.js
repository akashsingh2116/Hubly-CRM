import express from "express";
import ChatbotSettings from "../models/ChatbotSettings.js";
import { authRequired } from "../middleware/auth.js";
import { invalidateSettingsCache } from "../utils/missedChat.js";

const router = express.Router();

const EDITABLE_FIELDS = [
  "headerColor",
  "backgroundColor",
  "messageLine1",
  "messageLine2",
  "introNameLabel",
  "introPhoneLabel",
  "introEmailLabel",
  "introSubmitLabel",
  "welcomeMessage",
  "missedChatThresholdSeconds",
];

// GET /api/chatbot/settings — public (landing page + widget use this)
router.get("/settings", async (req, res, next) => {
  try {
    const settings = await ChatbotSettings.getSingleton();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// PUT /api/chatbot/settings — admin only
router.put("/settings", authRequired, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can edit settings" });
    }

    const settings = await ChatbotSettings.getSingleton();

    EDITABLE_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) settings[f] = req.body[f];
    });

    await settings.save();

    // Invalidate the in-memory cache so the next missedChat check uses new threshold
    invalidateSettingsCache();

    res.json(settings);
  } catch (err) {
    next(err);
  }
});

export default router;
