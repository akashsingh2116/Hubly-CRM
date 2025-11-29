// backend/src/routes/analytics.js
import express from "express";
import Ticket from "../models/Ticket.js";
import ChatbotSettings from "../models/ChatbotSettings.js";

const router = express.Router();

// Helper: is this ticket a "missed chat" based on threshold + timestamps?
function isTicketMissed(ticket, thresholdMs, now) {
  // Must have a first customer message
  if (!ticket.firstMessageAt) return false;

  // If any teammate reply exists, it's not missed
  if (ticket.firstResponseAt) return false;

  // If enough time passed since firstMessageAt -> missed
  const diff = now - ticket.firstMessageAt;
  return diff > thresholdMs;
}

// GET /api/analytics/overview
router.get("/overview", async (req, res) => {
  try {
    const now = new Date();

    // ---- 1) Missed chat threshold from chatbot settings ----
    const settings = await ChatbotSettings.getSingleton();
    const thresholdSeconds = settings.missedChatThresholdSeconds || 600; // default 10 min
    const thresholdMs = thresholdSeconds * 1000;

    // ---- 2) Time window: last 10 weeks ----
    const tenWeeksAgo = new Date(now);
    tenWeeksAgo.setDate(tenWeeksAgo.getDate() - 7 * 10);

    // Get all tickets in window (optionally filter to widget source only)
    const tickets = await Ticket.find({
      createdAt: { $gte: tenWeeksAgo },
      // source: "widget", // uncomment if you only want widget tickets
    });

    const totalChats = tickets.length;

    // ---- 3) Compute missedByWeek (Week 1..Week 10) ----
    const missedByWeek = [];

    for (let i = 9; i >= 0; i--) {
      // start of this week
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7 * i);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const missedCount = tickets.filter((t) => {
        const created = t.createdAt;
        if (!created) return false;
        if (created < weekStart || created >= weekEnd) return false;
        return isTicketMissed(t, thresholdMs, now);
      }).length;

      missedByWeek.push({
        label: `Week ${10 - i}`,
        value: missedCount,
      });
    }

    // ---- 4) Average reply time (seconds) ----
    // same definition as before: firstResponseAt - createdAt
    const replyDiffsSeconds = tickets
      .filter((t) => t.firstResponseAt)
      .map(
        (t) =>
          (t.firstResponseAt.getTime() - t.createdAt.getTime()) /
          1000
      );

    const averageReplyTimeSeconds =
      replyDiffsSeconds.length > 0
        ? Math.round(
            replyDiffsSeconds.reduce((a, b) => a + b, 0) /
              replyDiffsSeconds.length
          )
        : 0;

    // ---- 5) Resolved % and count ----
    const resolvedCount = tickets.filter(
      (t) => t.status === "resolved"
    ).length;

    const resolvedRatePercent =
      totalChats > 0
        ? Math.round((resolvedCount / totalChats) * 100)
        : 0;

    // ---- 6) Respond with exactly what Analytics.jsx expects ----
    res.json({
      totalChats,
      missedByWeek, // [{ label: "Week 1", value: number }, ...]
      averageReplyTimeSeconds,
      resolvedRatePercent,
      resolvedCount,
    });
  } catch (err) {
    console.error("GET /api/analytics/overview error:", err);
    res.status(500).json({ message: "Failed to compute analytics" });
  }
});

export default router;
