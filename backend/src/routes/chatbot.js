// backend/src/routes/chatbot.js
import express from "express";
import ChatbotSettings from "../models/ChatbotSettings.js";
import { authRequired } from "../middleware/auth.js"; // ✅ correct import

const router = express.Router();

// GET current settings (no auth – landing page + preview use this)
router.get("/settings", async (req, res) => {
  try {
    const settings = await ChatbotSettings.getSingleton();
    res.json(settings);
  } catch (err) {
    console.error("GET /chatbot/settings error:", err);
    res.status(500).json({ message: "Failed to load chatbot settings" });
  }
});

// UPDATE settings – only admin
router.put("/settings", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can edit settings" });
    }

    const settings = await ChatbotSettings.getSingleton();

    const fields = [
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

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        settings[f] = req.body[f];
      }
    });

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error("PUT /chatbot/settings error:", err);
    res.status(500).json({ message: "Failed to update chatbot settings" });
  }
});

export default router;
