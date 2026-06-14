import express from "express";
import { z } from "zod";
import Webhook from "../models/Webhook.js";
import { authRequired, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const webhookSchema = z.object({
  name:     z.string().min(1).max(100).trim(),
  url:      z.string().url(),
  events:   z.array(z.string()).min(1),
  secret:   z.string().default(""),
  isActive: z.boolean().default(true),
});

// GET /api/webhooks
router.get("/", authRequired, requireAdmin, async (req, res, next) => {
  try {
    const hooks = await Webhook.find().populate("createdBy", "firstName lastName").sort({ createdAt: -1 });
    res.json(hooks);
  } catch (err) { next(err); }
});

// GET valid events
router.get("/events", authRequired, (_req, res) => {
  res.json(Webhook.schema.statics.VALID_EVENTS || Webhook.VALID_EVENTS || []);
});

// POST /api/webhooks
router.post("/", authRequired, requireAdmin, validate(webhookSchema), async (req, res, next) => {
  try {
    const hook = await Webhook.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(hook);
  } catch (err) { next(err); }
});

// PATCH /api/webhooks/:id
router.patch("/:id", authRequired, requireAdmin, async (req, res, next) => {
  try {
    const hook = await Webhook.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!hook) return res.status(404).json({ message: "Webhook not found" });
    res.json(hook);
  } catch (err) { next(err); }
});

// DELETE /api/webhooks/:id
router.delete("/:id", authRequired, requireAdmin, async (req, res, next) => {
  try {
    const hook = await Webhook.findByIdAndDelete(req.params.id);
    if (!hook) return res.status(404).json({ message: "Webhook not found" });
    res.json({ message: "Webhook deleted" });
  } catch (err) { next(err); }
});

export default router;
