import express from "express";
import { authRequired } from "../middleware/auth.js";
import Ticket from "../models/Ticket.js";
import Contact from "../models/Contact.js";
import Company from "../models/Company.js";
import Deal from "../models/Deal.js";
import Task from "../models/Task.js";

const router = express.Router();

// GET /api/search?q=term&limit=5
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { q = "", limit = "5" } = req.query;
    const term = q.trim();
    if (!term) return res.json({ results: [] });

    const re       = new RegExp(term, "i");
    const max      = Math.min(10, parseInt(limit) || 5);
    const isAdmin  = req.user.role === "admin";

    const [tickets, contacts, companies, deals, tasks] = await Promise.all([
      Ticket.find({
        ...(isAdmin ? {} : { assignedTo: req.user.id }),
        $or: [{ customerName: re }, { customerEmail: re }, { ticketNumber: re }],
      }).select("ticketNumber customerName status").limit(max),

      Contact.find({ $or: [{ firstName: re }, { lastName: re }, { email: re }] })
        .select("firstName lastName email").limit(max),

      Company.find({ name: re }).select("name industry").limit(max),

      Deal.find({ title: re }).select("title stage value").limit(max),

      Task.find({
        $or: [{ title: re }],
        ...(isAdmin ? {} : { assignedTo: req.user.id }),
      }).select("title status priority dueDate").limit(max),
    ]);

    const results = [
      ...tickets.map((t) => ({
        type: "ticket",
        id:   t._id,
        title: `${t.ticketNumber} — ${t.customerName}`,
        subtitle: t.status,
        link: "/dashboard/contact-center",
      })),
      ...contacts.map((c) => ({
        type: "contact",
        id:   c._id,
        title: `${c.firstName} ${c.lastName}`.trim(),
        subtitle: c.email,
        link: `/dashboard/contacts/${c._id}`,
      })),
      ...companies.map((c) => ({
        type: "company",
        id:   c._id,
        title: c.name,
        subtitle: c.industry,
        link: `/dashboard/companies/${c._id}`,
      })),
      ...deals.map((d) => ({
        type: "deal",
        id:   d._id,
        title: d.title,
        subtitle: `${d.stage} — ${d.value}`,
        link: "/dashboard/pipeline",
      })),
      ...tasks.map((t) => ({
        type: "task",
        id:   t._id,
        title: t.title,
        subtitle: t.status,
        link: "/dashboard/tasks",
      })),
    ];

    res.json({ results });
  } catch (err) { next(err); }
});

export default router;
