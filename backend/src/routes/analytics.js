import express from "express";
import Ticket from "../models/Ticket.js";
import Message from "../models/Message.js";
import Deal from "../models/Deal.js";
import Contact from "../models/Contact.js";
import User from "../models/User.js";
import ChatbotSettings from "../models/ChatbotSettings.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

function isTicketMissed(ticket, thresholdMs, now) {
  if (!ticket.firstMessageAt) return false;
  if (ticket.firstResponseAt) return false;
  return (now - ticket.firstMessageAt) > thresholdMs;
}

// GET /api/analytics/overview?from=ISO&to=ISO
router.get("/overview", async (req, res, next) => {
  try {
    const now   = new Date();
    const toDate   = req.query.to   ? new Date(req.query.to)   : now;
    const fromDate = req.query.from ? new Date(req.query.from) : (() => {
      const d = new Date(now); d.setDate(d.getDate() - 70); return d;
    })();

    const settings     = await ChatbotSettings.getSingleton();
    const thresholdMs  = (settings.missedChatThresholdSeconds || 600) * 1000;

    const tickets = await Ticket.find({ createdAt: { $gte: fromDate, $lte: toDate } });
    const totalChats = tickets.length;

    // Build weekly buckets between fromDate and toDate
    const msPerWeek = 7 * 24 * 3600 * 1000;
    const numWeeks  = Math.max(1, Math.ceil((toDate - fromDate) / msPerWeek));
    const missedByWeek = [];
    for (let i = 0; i < numWeeks; i++) {
      const wStart = new Date(fromDate.getTime() + i * msPerWeek);
      const wEnd   = new Date(wStart.getTime() + msPerWeek);
      const missed = tickets.filter((t) => {
        if (!t.createdAt || t.createdAt < wStart || t.createdAt >= wEnd) return false;
        return isTicketMissed(t, thresholdMs, now);
      }).length;
      missedByWeek.push({ label: `W${i + 1}`, value: missed });
    }

    const replyDiffs = tickets
      .filter((t) => t.firstResponseAt && t.firstMessageAt)
      .map((t) => (t.firstResponseAt - t.firstMessageAt) / 1000);

    const averageReplyTimeSeconds = replyDiffs.length
      ? Math.round(replyDiffs.reduce((a, b) => a + b, 0) / replyDiffs.length)
      : 0;

    const resolvedCount       = tickets.filter((t) => t.status === "resolved").length;
    const resolvedRatePercent = totalChats > 0 ? Math.round((resolvedCount / totalChats) * 100) : 0;
    const slaBreached         = tickets.filter((t) => t.slaFirstResponseBreachedAt || t.slaResolutionBreachedAt).length;

    res.json({ totalChats, missedByWeek, averageReplyTimeSeconds, resolvedRatePercent, resolvedCount, slaBreached });
  } catch (err) { next(err); }
});

// GET /api/analytics/agents?from=&to=
router.get("/agents", authRequired, async (req, res, next) => {
  try {
    const now    = new Date();
    const toDate   = req.query.to   ? new Date(req.query.to)   : now;
    const fromDate = req.query.from ? new Date(req.query.from) : (() => {
      const d = new Date(now); d.setDate(d.getDate() - 30); return d;
    })();

    const [tickets, agents] = await Promise.all([
      Ticket.find({ createdAt: { $gte: fromDate, $lte: toDate } }).select("assignedTo status resolvedAt firstResponseAt firstMessageAt"),
      User.find().select("firstName lastName role"),
    ]);

    const byAgent = {};
    agents.forEach((a) => {
      byAgent[a._id.toString()] = {
        agentId:    a._id,
        name:       `${a.firstName} ${a.lastName}`,
        role:       a.role,
        total:      0,
        resolved:   0,
        avgReplyMs: [],
      };
    });

    tickets.forEach((t) => {
      const key = t.assignedTo?.toString();
      if (!key || !byAgent[key]) return;
      byAgent[key].total++;
      if (t.status === "resolved") byAgent[key].resolved++;
      if (t.firstResponseAt && t.firstMessageAt) {
        byAgent[key].avgReplyMs.push(t.firstResponseAt - t.firstMessageAt);
      }
    });

    const result = Object.values(byAgent).map((a) => ({
      agentId:                a.agentId,
      name:                   a.name,
      role:                   a.role,
      totalTickets:           a.total,
      resolvedTickets:        a.resolved,
      averageFirstReplyMs:    a.avgReplyMs.length
        ? Math.round(a.avgReplyMs.reduce((s, v) => s + v, 0) / a.avgReplyMs.length)
        : null,
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/analytics/pipeline
router.get("/pipeline", authRequired, async (req, res, next) => {
  try {
    const grouped = await Deal.aggregate([
      {
        $group: {
          _id:        "$stage",
          count:      { $sum: 1 },
          totalValue: { $sum: "$value" },
        },
      },
    ]);

    const stageOrder = Deal.STAGES || ["lead","qualified","proposal","negotiation","closed_won","closed_lost"];
    const map = Object.fromEntries(grouped.map((g) => [g._id, g]));

    const pipeline = stageOrder.map((s) => ({
      stage:      s,
      count:      map[s]?.count || 0,
      totalValue: map[s]?.totalValue || 0,
    }));

    const totalRevenue = grouped
      .filter((g) => g._id === "closed_won")
      .reduce((s, g) => s + g.totalValue, 0);

    const newContacts = await Contact.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
    });

    res.json({ pipeline, totalRevenue, newContactsLast30Days: newContacts });
  } catch (err) { next(err); }
});

// GET /api/analytics/export?from=&to=  — CSV download
router.get("/export", authRequired, async (req, res, next) => {
  try {
    const now    = new Date();
    const toDate   = req.query.to   ? new Date(req.query.to)   : now;
    const fromDate = req.query.from ? new Date(req.query.from) : (() => {
      const d = new Date(now); d.setDate(d.getDate() - 30); return d;
    })();

    const tickets = await Ticket.find({ createdAt: { $gte: fromDate, $lte: toDate } })
      .populate("assignedTo", "firstName lastName")
      .lean();

    const header = ["ticketNumber","customerName","customerEmail","status","assignedTo","createdAt","resolvedAt","firstReplySeconds"];
    const rows   = tickets.map((t) => {
      const firstReply = t.firstResponseAt && t.firstMessageAt
        ? Math.round((new Date(t.firstResponseAt) - new Date(t.firstMessageAt)) / 1000)
        : "";
      const agent = t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : "";
      return [
        t.ticketNumber, t.customerName, t.customerEmail, t.status, agent,
        t.createdAt ? new Date(t.createdAt).toISOString() : "",
        t.resolvedAt ? new Date(t.resolvedAt).toISOString() : "",
        firstReply,
      ].join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="hubly-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

export default router;
