import express from "express";
import { z } from "zod";
import Activity from "../models/Activity.js";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const activitySchema = z.object({
  type:            z.enum(["note","call","email","meeting"]).default("note"),
  title:           z.string().max(200).trim().default(""),
  body:            z.string().trim().default(""),
  contact:         z.string().optional(),
  company:         z.string().optional(),
  deal:            z.string().optional(),
  ticket:          z.string().optional(),
  isInternal:      z.boolean().default(false),
  scheduledAt:     z.string().optional(),
  durationMinutes: z.number().min(0).optional(),
  outcome:         z.string().default(""),
});

// GET /api/activities?contact=&deal=&ticket=&page=1&limit=20
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { contact, company, deal, ticket, page = "1", limit = "20" } = req.query;
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const query    = {};

    if (contact) query.contact = contact;
    if (company) query.company = company;
    if (deal)    query.deal    = deal;
    if (ticket) {
      query.ticket = ticket;
      // If fetching for a ticket, only return internal notes by default
      query.isInternal = true;
    }

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate("owner", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Activity.countDocuments(query),
    ]);

    res.json({ activities, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) { next(err); }
});

// POST /api/activities
router.post("/", authRequired, validate(activitySchema), async (req, res, next) => {
  try {
    const activity = await Activity.create({ ...req.body, owner: req.user.id });
    const populated = await Activity.findById(activity._id).populate("owner", "firstName lastName");
    res.status(201).json(populated);
  } catch (err) { next(err); }
});

// PATCH /api/activities/:id
router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const a = await Activity.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true }
    ).populate("owner", "firstName lastName");
    if (!a) return res.status(404).json({ message: "Activity not found" });
    res.json(a);
  } catch (err) { next(err); }
});

// DELETE /api/activities/:id
router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const a = await Activity.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ message: "Activity not found" });
    res.json({ message: "Activity deleted" });
  } catch (err) { next(err); }
});

export default router;
