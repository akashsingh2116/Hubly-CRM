// backend/src/routes/messages.js
import express from "express";
import { authRequired } from "../middleware/auth.js";
import Message from "../models/Message.js";
import Ticket from "../models/Ticket.js";

const router = express.Router();

/**
 * GET /api/messages/ticket/:ticketId
 * Authenticated – list all messages for a ticket
 */
router.get("/ticket/:ticketId", authRequired, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const messages = await Message.find({ ticket: ticketId }).sort(
      "createdAt"
    );

    res.json(messages);
  } catch (err) {
    console.error("GET /api/messages/ticket/:ticketId error:", err);
    res.status(500).json({ message: "Failed to load messages" });
  }
});

/**
 * POST /api/messages/ticket/:ticketId
 * Authenticated – AGENT sends a message
 */
router.post("/ticket/:ticketId", authRequired, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "text is required" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const cleanText = text.trim();

    const msg = await Message.create({
      ticket: ticket._id,
      senderType: "agent",
      senderUser: req.user.id,
      text: cleanText,
    });

    // 🔹 first agent response timestamp
    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = msg.createdAt;
    }

    // 🔹 if previously marked missed, clear it
    if (ticket.isMissed) {
      ticket.isMissed = false;
      ticket.missedAt = undefined;
    }

    ticket.lastMessageSnippet =
      cleanText.length > 80 ? cleanText.slice(0, 77) + "..." : cleanText;
    ticket.lastMessageAt = msg.createdAt;
    ticket.lastMessageFrom = "agent";

    await ticket.save();

    res.status(201).json(msg);
  } catch (err) {
    console.error("POST /api/messages/ticket/:ticketId error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;
