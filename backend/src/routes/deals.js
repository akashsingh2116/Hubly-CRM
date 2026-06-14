import express from "express";
import { z } from "zod";
import Deal from "../models/Deal.js";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { triggerWebhooks } from "../utils/webhook.js";

const router = express.Router();

const dealSchema = z.object({
  title:       z.string().min(1).max(200).trim(),
  contact:     z.string().optional(),
  company:     z.string().optional(),
  stage:       z.enum(["lead","qualified","proposal","negotiation","closed_won","closed_lost"]).default("lead"),
  value:       z.number().min(0).default(0),
  currency:    z.string().max(3).default("USD"),
  closeDate:   z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  description: z.string().default(""),
  tags:        z.array(z.string()).default([]),
});

// GET /api/deals?stage=&page=1&limit=25&owner=me
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { stage, page = "1", limit = "50", owner } = req.query;
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, parseInt(limit) || 50);
    const query    = {};

    if (stage) query.stage = stage;
    if (owner === "me") query.owner = req.user.id;

    const [deals, total] = await Promise.all([
      Deal.find(query)
        .populate("contact", "firstName lastName email")
        .populate("company", "name")
        .populate("owner", "firstName lastName")
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Deal.countDocuments(query),
    ]);

    res.json({ deals, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) { next(err); }
});

// GET /api/deals/pipeline — all deals grouped by stage (for Kanban)
router.get("/pipeline", authRequired, async (req, res, next) => {
  try {
    const deals = await Deal.find()
      .populate("contact", "firstName lastName")
      .populate("company", "name")
      .populate("owner", "firstName lastName")
      .sort({ updatedAt: -1 });

    const grouped = {};
    Deal.STAGES.forEach((s) => { grouped[s] = []; });
    deals.forEach((d) => {
      if (grouped[d.stage]) grouped[d.stage].push(d);
    });

    // Stage totals
    const totals = {};
    Deal.STAGES.forEach((s) => {
      totals[s] = grouped[s].reduce((sum, d) => sum + (d.value || 0), 0);
    });

    res.json({ pipeline: grouped, totals, stages: Deal.STAGES });
  } catch (err) { next(err); }
});

// GET /api/deals/:id
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate("contact", "firstName lastName email phone")
      .populate("company", "name industry")
      .populate("owner", "firstName lastName");
    if (!deal) return res.status(404).json({ message: "Deal not found" });
    res.json(deal);
  } catch (err) { next(err); }
});

// POST /api/deals
router.post("/", authRequired, validate(dealSchema), async (req, res, next) => {
  try {
    const deal = await Deal.create({ ...req.body, owner: req.user.id });
    triggerWebhooks("deal.created", deal).catch(() => {});
    res.status(201).json(deal);
  } catch (err) { next(err); }
});

// PATCH /api/deals/:id
router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    Object.assign(deal, req.body);
    await deal.save(); // triggers pre-save probability hook

    const populated = await Deal.findById(deal._id)
      .populate("contact", "firstName lastName")
      .populate("company", "name")
      .populate("owner", "firstName lastName");

    triggerWebhooks("deal.updated", populated).catch(() => {});
    res.json(populated);
  } catch (err) { next(err); }
});

// DELETE /api/deals/:id
router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const d = await Deal.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ message: "Deal not found" });
    res.json({ message: "Deal deleted" });
  } catch (err) { next(err); }
});

export default router;
