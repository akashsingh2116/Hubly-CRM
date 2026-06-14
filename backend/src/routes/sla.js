import express from "express";
import { z } from "zod";
import SlaPolicy from "../models/SlaPolicy.js";
import { authRequired, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { invalidateSlaPolicyCache } from "../utils/sla.js";

const router = express.Router();

const policySchema = z.object({
  name:                       z.string().min(1).max(100).trim(),
  firstResponseTargetMinutes: z.number().min(1).default(60),
  resolutionTargetMinutes:    z.number().min(1).default(480),
  businessHoursOnly:          z.boolean().default(false),
  isDefault:                  z.boolean().default(false),
});

// GET /api/sla
router.get("/", authRequired, async (req, res, next) => {
  try {
    const policies = await SlaPolicy.find().sort({ isDefault: -1, name: 1 });
    res.json(policies);
  } catch (err) { next(err); }
});

// POST /api/sla
router.post("/", authRequired, requireAdmin, validate(policySchema), async (req, res, next) => {
  try {
    // If this is the default, unset others
    if (req.body.isDefault) {
      await SlaPolicy.updateMany({}, { isDefault: false });
    }
    const policy = await SlaPolicy.create(req.body);
    invalidateSlaPolicyCache();
    res.status(201).json(policy);
  } catch (err) { next(err); }
});

// PATCH /api/sla/:id
router.patch("/:id", authRequired, requireAdmin, async (req, res, next) => {
  try {
    if (req.body.isDefault) {
      await SlaPolicy.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
    }
    const policy = await SlaPolicy.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    invalidateSlaPolicyCache();
    res.json(policy);
  } catch (err) { next(err); }
});

// DELETE /api/sla/:id
router.delete("/:id", authRequired, requireAdmin, async (req, res, next) => {
  try {
    const p = await SlaPolicy.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ message: "Policy not found" });
    invalidateSlaPolicyCache();
    res.json({ message: "Policy deleted" });
  } catch (err) { next(err); }
});

export default router;
