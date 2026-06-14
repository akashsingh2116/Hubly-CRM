import express from "express";
import { authRequired } from "../middleware/auth.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import { updateMissedStatusForTickets } from "../utils/missedChat.js";
import { emitTicketUpdated } from "../socket/index.js";
import { sendTicketAssigned } from "../utils/email.js";

const router = express.Router();

/**
 * GET /api/tickets
 * Query: status (all|resolved|unresolved), search, page (default 1), limit (default 30)
 * Returns: { tickets, pagination: { total, page, limit, pages } }
 */
router.get("/", authRequired, async (req, res, next) => {
  try {
    const {
      status = "all",
      search = "",
      page  = "1",
      limit = "30",
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip     = (pageNum - 1) * limitNum;

    const isAdmin = req.user?.role === "admin";
    const query   = {};

    if (!isAdmin) {
      query.assignedTo = req.user.id;
    }

    if (status === "resolved") {
      query.status = "resolved";
    } else if (status === "unresolved") {
      query.status = { $ne: "resolved" };
    }

    if (search.trim()) {
      const re = new RegExp(search.trim(), "i");
      query.$or = [
        { customerName:  re },
        { customerEmail: re },
        { customerPhone: re },
        { ticketNumber:  re },
      ];
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate("assignedTo", "-passwordHash")
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Ticket.countDocuments(query),
    ]);

    await updateMissedStatusForTickets(tickets);

    res.json({
      tickets,
      pagination: {
        total,
        page:  pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tickets/:ticketId/assign
 * Body: { assignedToUserId }
 */
router.patch("/:ticketId/assign", authRequired, async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { assignedToUserId } = req.body;

    if (!assignedToUserId) {
      return res.status(400).json({ message: "assignedToUserId is required" });
    }

    const [user, ticket] = await Promise.all([
      User.findById(assignedToUserId),
      Ticket.findById(ticketId),
    ]);

    if (!user)   return res.status(400).json({ message: "User not found" });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.assignedTo = user._id;
    await ticket.save();

    const populated = await Ticket.findById(ticketId).populate("assignedTo", "-passwordHash");

    emitTicketUpdated(ticketId, populated);
    sendTicketAssigned(ticket, user).catch(() => {}); // fire-and-forget

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tickets/:ticketId/status
 * Body: { status }
 */
router.patch("/:ticketId/status", authRequired, async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { status }   = req.body;

    if (!["open", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;

    if (status === "resolved") {
      ticket.resolvedAt = new Date();
      ticket.isMissed   = false;
      ticket.missedAt   = undefined;
    } else {
      ticket.resolvedAt = undefined;
    }

    await ticket.save();

    const populated = await Ticket.findById(ticketId).populate("assignedTo", "-passwordHash");

    emitTicketUpdated(ticketId, populated);

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tickets/:ticketId/labels
 * Body: { labels: string[] }
 */
router.patch("/:ticketId/labels", authRequired, async (req, res, next) => {
  try {
    const { labels } = req.body;
    if (!Array.isArray(labels)) {
      return res.status(400).json({ message: "labels must be an array" });
    }
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.ticketId,
      { labels },
      { new: true }
    ).populate("assignedTo", "-passwordHash");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    emitTicketUpdated(req.params.ticketId, ticket);
    res.json(ticket);
  } catch (err) { next(err); }
});

/**
 * POST /api/tickets/bulk
 * Body: { ticketIds: string[], action: "resolve"|"assign"|"delete", assignedTo?: string }
 */
router.post("/bulk", authRequired, async (req, res, next) => {
  try {
    const { ticketIds, action, assignedTo } = req.body;
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ message: "ticketIds required" });
    }

    if (action === "resolve") {
      await Ticket.updateMany(
        { _id: { $in: ticketIds } },
        { status: "resolved", resolvedAt: new Date(), isMissed: false }
      );
    } else if (action === "assign") {
      if (!assignedTo) return res.status(400).json({ message: "assignedTo required" });
      await Ticket.updateMany({ _id: { $in: ticketIds } }, { assignedTo });
    } else if (action === "delete") {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
      }
      await Ticket.deleteMany({ _id: { $in: ticketIds } });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    res.json({ ok: true, affected: ticketIds.length });
  } catch (err) { next(err); }
});

export default router;
