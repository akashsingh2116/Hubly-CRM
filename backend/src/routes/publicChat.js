import express from "express";
import Ticket from "../models/Ticket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { publicChatLimiter } from "../middleware/rateLimiter.js";
import { emitNewMessage } from "../socket/index.js";
import ChatbotSettings from "../models/ChatbotSettings.js";
import ChatbotAutomation from "../models/ChatbotAutomation.js";

const router = express.Router();

async function getAdmin() {
  const admin = await User.findOne({ role: "admin" });
  if (!admin) throw new Error("No admin exists. Please set up an admin account first.");
  return admin;
}

/**
 * POST /api/public/chat/start
 * Rate-limited. Body: { name, phone, email }
 */
router.post("/start", publicChatLimiter, async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    if (!name?.trim() || !phone?.trim() || !email?.trim()) {
      return res.status(400).json({ message: "name, phone and email are required" });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const admin = await getAdmin();

    // Fetch chatbot greeting messages
    const settings = await ChatbotSettings.getSingleton();

    const count        = await Ticket.countDocuments();
    const ticketNumber = `HUB-${String(count + 1).padStart(4, "0")}`;

    const ticket = await Ticket.create({
      customerName:  name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim().toLowerCase(),
      ticketNumber,
      assignedTo: admin._id,
      status:     "open",
      source:     "widget",
    });

    const line1 = settings.messageLine1 || "How can I help you?";
    const line2 = settings.messageLine2 || "Ask me anything!";

    const introMsgs = await Message.insertMany([
      { ticket: ticket._id, senderType: "agent", sender: admin._id, text: line1 },
      { ticket: ticket._id, senderType: "agent", sender: admin._id, text: line2 },
    ]);

    const last = introMsgs[introMsgs.length - 1];
    ticket.lastMessageSnippet = last.text;
    ticket.lastMessageAt      = last.createdAt;
    ticket.lastMessageFrom    = "agent";
    await ticket.save();

    return res.status(201).json({ ticket, messages: introMsgs });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/public/chat/:ticketId/messages
 * Rate-limited. Body: { text }
 */
router.post("/:ticketId/messages", publicChatLimiter, async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { text }     = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "text is required" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const cleanText = text.trim();

    const msg = await Message.create({
      ticket:     ticket._id,
      senderType: "customer",
      text:       cleanText,
    });

    if (!ticket.firstMessageAt) {
      ticket.firstMessageAt = msg.createdAt;
    }

    ticket.lastMessageSnippet =
      cleanText.length > 80 ? cleanText.slice(0, 77) + "..." : cleanText;
    ticket.lastMessageAt   = msg.createdAt;
    ticket.lastMessageFrom = "customer";

    await ticket.save();

    emitNewMessage(ticketId, msg);

    // Check keyword-based automation rules and send bot replies
    const automationRules = await ChatbotAutomation.find({
      isActive: true,
      triggerType: "keyword",
    }).sort({ priority: 1 });

    const lowerText = cleanText.toLowerCase();
    for (const rule of automationRules) {
      const matched = rule.keywords.some((kw) =>
        lowerText.includes(kw.toLowerCase())
      );
      if (matched) {
        const admin = await getAdmin();
        const autoMsg = await Message.create({
          ticket:     ticket._id,
          senderType: "agent",
          sender:     admin._id,
          text:       rule.replyText,
        });
        ticket.lastMessageSnippet = rule.replyText.slice(0, 80);
        ticket.lastMessageAt      = autoMsg.createdAt;
        ticket.lastMessageFrom    = "agent";
        await ticket.save();
        emitNewMessage(ticketId, autoMsg);
        break; // only fire the highest-priority matching rule
      }
    }

    return res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/public/chat/:ticketId/messages
 * Query: after (message _id to load only newer messages)
 */
router.get("/:ticketId/messages", publicChatLimiter, async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { after }    = req.query;

    const query = { ticket: ticketId };
    if (after) {
      query._id = { $gt: after };
    }

    const messages = await Message.find(query).sort({ createdAt: 1 });
    return res.json(messages);
  } catch (err) {
    next(err);
  }
});

export default router;
