// backend/src/routes/tickets.js
import express from "express";
import { authRequired } from "../middleware/auth.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import { updateMissedStatusForTickets } from "../utils/missedChat.js";

const router = express.Router();

/**
 * GET /api/tickets
 * Query:
 *   status = all | resolved | unresolved
 *   search = string (name/email/phone/ticketNumber)
 *
 *  - Admin  → sees ALL tickets
 *  - Member → sees ONLY tickets where assignedTo = current user
 */
router.get("/", authRequired, async (req, res) => {
  try {
    const { status = "all", search = "" } = req.query;

    const isAdmin = req.user?.role === "admin";
    const userId = req.user?.id; // comes from JWT in authRequired

    const query = {};

    // 🔹 role-based restriction
    if (!isAdmin) {
      // member: only tickets assigned to them
      // Mongoose will cast string -> ObjectId
      query.assignedTo = userId;
    }
    // admin: no extra filter => sees all tickets

    // 🔹 status filter
    if (status === "resolved") {
      query.status = "resolved";
    } else if (status === "unresolved") {
      // unresolved = anything not resolved
      query.status = { $ne: "resolved" };
    }

    // 🔹 text search
    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [
        { customerName: re },
        { customerEmail: re },
        { customerPhone: re },
        { ticketNumber: re },
      ];
    }

    let tickets = await Ticket.find(query)
      .populate("assignedTo")
      .sort({ lastMessageAt: -1, createdAt: -1 });

    // 🔹 update missed flags before returning them (keeps your existing logic)
    tickets = await updateMissedStatusForTickets(tickets);

    res.json(tickets);
  } catch (err) {
    console.error("GET /api/tickets error:", err);
    res.status(500).json({ message: "Failed to load tickets" });
  }
});

/**
 * PATCH /api/tickets/:ticketId/assign
 * Body: { assignedToUserId }
 */
router.patch("/:ticketId/assign", authRequired, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { assignedToUserId } = req.body;

    const user = await User.findById(assignedToUserId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.assignedTo = user._id;
    await ticket.save();

    const populated = await Ticket.findById(ticketId).populate("assignedTo");
    res.json(populated);
  } catch (err) {
    console.error("PATCH /api/tickets/:ticketId/assign error:", err);
    res.status(500).json({ message: "Failed to assign ticket" });
  }
});

/**
 * PATCH /api/tickets/:ticketId/status
 * Body: { status }
 */
router.patch("/:ticketId/status", authRequired, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!["open", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = status;

    if (status === "resolved") {
      ticket.resolvedAt = new Date();
      // resolved tickets shouldn't be missed anymore
      ticket.isMissed = false;
      ticket.missedAt = undefined;
    } else {
      ticket.resolvedAt = undefined;
    }

    await ticket.save();
    const populated = await Ticket.findById(ticketId).populate("assignedTo");
    res.json(populated);
  } catch (err) {
    console.error("PATCH /api/tickets/:ticketId/status error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

export default router;
