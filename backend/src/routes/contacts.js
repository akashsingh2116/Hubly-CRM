import express from "express";
import { z } from "zod";
import Contact from "../models/Contact.js";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { triggerWebhooks } from "../utils/webhook.js";

const router = express.Router();

const contactSchema = z.object({
  firstName:    z.string().min(1).max(80).trim(),
  lastName:     z.string().max(80).trim().default(""),
  email:        z.string().email().toLowerCase().trim().optional().or(z.literal("")),
  phone:        z.string().max(30).trim().default(""),
  company:      z.string().optional(),
  status:       z.enum(["lead","prospect","customer","churned","inactive"]).default("lead"),
  source:       z.enum(["widget","manual","import","referral","other"]).default("manual"),
  tags:         z.array(z.string()).default([]),
  notes:        z.string().default(""),
  customFields: z.record(z.string()).default({}),
});

// GET /api/contacts?search=&status=&page=1&limit=25
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { search = "", status, page = "1", limit = "25" } = req.query;
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 25);
    const query    = {};

    if (status) query.status = status;
    if (search.trim()) {
      const re = new RegExp(search.trim(), "i");
      query.$or = [
        { firstName: re }, { lastName: re },
        { email: re },     { phone: re },
      ];
    }

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .populate("company", "name")
        .populate("owner", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Contact.countDocuments(query),
    ]);

    res.json({ contacts, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) { next(err); }
});

// GET /api/contacts/:id
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const c = await Contact.findById(req.params.id)
      .populate("company", "name industry")
      .populate("owner", "firstName lastName")
      .populate("linkedTickets", "ticketNumber status customerName createdAt");
    if (!c) return res.status(404).json({ message: "Contact not found" });
    res.json(c);
  } catch (err) { next(err); }
});

// POST /api/contacts
router.post("/", authRequired, validate(contactSchema), async (req, res, next) => {
  try {
    const contact = await Contact.create({ ...req.body, owner: req.user.id });
    triggerWebhooks("contact.created", contact).catch(() => {});
    res.status(201).json(contact);
  } catch (err) { next(err); }
});

// PATCH /api/contacts/:id
router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true }
    ).populate("company", "name").populate("owner", "firstName lastName");
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  } catch (err) { next(err); }
});

// DELETE /api/contacts/:id
router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const c = await Contact.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ message: "Contact not found" });
    res.json({ message: "Contact deleted" });
  } catch (err) { next(err); }
});

// POST /api/contacts/import  — CSV bulk import
router.post("/import", authRequired, async (req, res, next) => {
  try {
    const { rows } = req.body; // [{ firstName, lastName, email, phone, ... }]
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "rows array required" });
    }

    const docs = rows.map((r) => ({ ...r, owner: req.user.id }));
    const result = await Contact.insertMany(docs, { ordered: false });
    res.status(201).json({ created: result.length });
  } catch (err) { next(err); }
});

export default router;
