import express from "express";
import { z } from "zod";
import CannedResponse from "../models/CannedResponse.js";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const schema = z.object({
  name:     z.string().min(1).max(100).trim(),
  shortcut: z.string().max(50).trim().optional(),
  content:  z.string().min(1),
  isGlobal: z.boolean().default(true),
});

// GET /api/canned-responses?search=
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    const query = { $or: [{ isGlobal: true }, { createdBy: req.user.id }] };

    if (search.trim()) {
      const re = new RegExp(search.trim(), "i");
      query.$and = [{ $or: [{ name: re }, { content: re }, { shortcut: re }] }];
    }

    const responses = await CannedResponse.find(query).sort({ name: 1 });
    res.json(responses);
  } catch (err) { next(err); }
});

// POST /api/canned-responses
router.post("/", authRequired, validate(schema), async (req, res, next) => {
  try {
    const cr = await CannedResponse.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(cr);
  } catch (err) { next(err); }
});

// PATCH /api/canned-responses/:id
router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const cr = await CannedResponse.findOneAndUpdate(
      { _id: req.params.id, $or: [{ isGlobal: true }, { createdBy: req.user.id }] },
      { $set: req.body },
      { new: true }
    );
    if (!cr) return res.status(404).json({ message: "Not found" });
    res.json(cr);
  } catch (err) { next(err); }
});

// DELETE /api/canned-responses/:id
router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const cr = await CannedResponse.findByIdAndDelete(req.params.id);
    if (!cr) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) { next(err); }
});

export default router;
