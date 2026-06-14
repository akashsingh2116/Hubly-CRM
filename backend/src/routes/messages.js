import express from "express";
import { authRequired } from "../middleware/auth.js";
import Message from "../models/Message.js";
import Ticket from "../models/Ticket.js";
import { emitNewMessage } from "../socket/index.js";

const router = express.Router();

/**
 * GET /api/messages/ticket/:ticketId
 * Query: before (message _id cursor), limit (default 50, max 100)
 * Returns: { messages, hasMore }
 *
 * Usage:
 *   Initial load:           GET /api/messages/ticket/:id?limit=50
 *   Load older messages:    GET /api/messages/ticket/:id?before=<lastMsgId>&limit=50
 */
router.get("/ticket/:ticketId", authRequired, async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { before, limit = "50" } = req.query;

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const query = { ticket: ticketId };
    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum + 1); // fetch one extra to determine hasMore

    const hasMore = messages.length > limitNum;
    const result  = messages.slice(0, limitNum).reverse(); // oldest first

    res.json({ messages: result, hasMore });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/messages/ticket/:ticketId
 * Body: { text?, attachments? }  (text OR attachments required)
 * Agent sends a message (optionally with file attachments).
 */
router.post("/ticket/:ticketId", authRequired, async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { text = "", attachments = [] } = req.body;

    const cleanText = text.trim();

    if (!cleanText && (!Array.isArray(attachments) || attachments.length === 0)) {
      return res.status(400).json({ message: "text or attachments required" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const msg = await Message.create({
      ticket:      ticket._id,
      senderType:  "agent",
      sender:      req.user.id,
      text:        cleanText,
      attachments,
    });

    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = msg.createdAt;
    }

    if (ticket.isMissed) {
      ticket.isMissed = false;
      ticket.missedAt = undefined;
    }

    const snippet = cleanText || (attachments[0]?.originalName ?? "Attachment");
    ticket.lastMessageSnippet =
      snippet.length > 80 ? snippet.slice(0, 77) + "..." : snippet;
    ticket.lastMessageAt   = msg.createdAt;
    ticket.lastMessageFrom = "agent";

    await ticket.save();

    emitNewMessage(ticketId, msg);

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

export default router;
