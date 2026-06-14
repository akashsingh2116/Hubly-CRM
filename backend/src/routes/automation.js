import express from "express";
import { z } from "zod";
import ChatbotAutomation from "../models/ChatbotAutomation.js";
import { authRequired, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const automationSchema = z.object({
  name:              z.string().min(1).max(100).trim(),
  isActive:          z.boolean().default(true),
  triggerType:       z.enum(["keyword","working_hours","new_chat"]),
  keywords:          z.array(z.string()).default([]),
  workingHoursStart: z.string().default("09:00"),
  workingHoursEnd:   z.string().default("18:00"),
  workingHoursDays:  z.array(z.number().min(0).max(6)).default([1,2,3,4,5]),
  replyText:         z.string().min(1),
  priority:          z.number().default(0),
});

// GET /api/automation
router.get("/", authRequired, async (req, res, next) => {
  try {
    const rules = await ChatbotAutomation.find().sort({ priority: 1, createdAt: 1 });
    res.json(rules);
  } catch (err) { next(err); }
});

// POST /api/automation
router.post("/", authRequired, requireAdmin, validate(automationSchema), async (req, res, next) => {
  try {
    const rule = await ChatbotAutomation.create(req.body);
    res.status(201).json(rule);
  } catch (err) { next(err); }
});

// PATCH /api/automation/:id
router.patch("/:id", authRequired, requireAdmin, async (req, res, next) => {
  try {
    const rule = await ChatbotAutomation.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!rule) return res.status(404).json({ message: "Rule not found" });
    res.json(rule);
  } catch (err) { next(err); }
});

// DELETE /api/automation/:id
router.delete("/:id", authRequired, requireAdmin, async (req, res, next) => {
  try {
    const r = await ChatbotAutomation.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Rule not found" });
    res.json({ message: "Rule deleted" });
  } catch (err) { next(err); }
});

export default router;
