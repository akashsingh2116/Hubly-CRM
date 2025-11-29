// backend/src/routes/publicChat.js
import express from "express";
import bcrypt from "bcryptjs";
import Ticket from "../models/Ticket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * Helper: find the single admin.
 * If none exists, auto-create a default admin and return it.
 */
async function getAdmin() {
  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    throw new Error("No admin exists. Create an admin first.");
  }
  return admin;
}


/**
 * POST /api/public/chat/start
 * Body: { name, phone, email }
 * Creates a ticket assigned to admin + intro messages.
 */
router.post("/start", async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      return res
        .status(400)
        .json({ message: "name, phone and email are required" });
    }

    const admin = await getAdmin();

    // Generate ticket number
    const count = await Ticket.countDocuments();
    const ticketNumber = `HUB-${String(count + 1).padStart(4, "0")}`;

    const ticket = await Ticket.create({
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      ticketNumber,
      assignedTo: admin._id,
      status: "open",
      source: "widget",
    });

    // Intro messages from agent/bot
    const introMsgs = await Message.insertMany([
      {
        ticket: ticket._id,
        senderType: "agent",
        senderUser: admin._id,
        text: "How can I help you?",
      },
      {
        ticket: ticket._id,
        senderType: "agent",
        senderUser: admin._id,
        text: "State your query",
      },
    ]);

    const lastIntro = introMsgs[introMsgs.length - 1];
    ticket.lastMessageSnippet = lastIntro.text;
    ticket.lastMessageAt = lastIntro.createdAt;
    ticket.lastMessageFrom = "agent";
    await ticket.save();

    return res.status(201).json({
      ticket,
      messages: introMsgs,
    });
  } catch (err) {
    console.error("POST /api/public/chat/start error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Failed to start chat" });
  }
});

/**
 * POST /api/public/chat/:ticketId/messages
 * Body: { text }
 * CUSTOMER sends a message from widget.
 */
router.post("/:ticketId/messages", async (req, res) => {
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
      senderType: "customer", // IMPORTANT: customer
      text: cleanText,
    });

    // 🔹 first customer message timestamp
    if (!ticket.firstMessageAt) {
      ticket.firstMessageAt = msg.createdAt;
    }

    ticket.lastMessageSnippet =
      cleanText.length > 80 ? cleanText.slice(0, 77) + "..." : cleanText;
    ticket.lastMessageAt = msg.createdAt;
    ticket.lastMessageFrom = "customer";
    await ticket.save();

    return res.status(201).json(msg);
  } catch (err) {
    console.error(
      "POST /api/public/chat/:ticketId/messages error:",
      err
    );
    return res
      .status(500)
      .json({ message: err.message || "Failed to send message" });
  }
});

/**
 * GET /api/public/chat/:ticketId/messages
 * Reload all messages for a public chat (widget).
 */
router.get("/:ticketId/messages", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const messages = await Message.find({ ticket: ticketId }).sort(
      "createdAt"
    );
    return res.json(messages);
  } catch (err) {
    console.error(
      "GET /api/public/chat/:ticketId/messages error:",
      err
    );
    return res
      .status(500)
      .json({ message: "Failed to load chat messages" });
  }
});

export default router;
