import express from "express";
import { z } from "zod";
import Company from "../models/Company.js";
import Contact from "../models/Contact.js";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const companySchema = z.object({
  name:     z.string().min(1).max(120).trim(),
  industry: z.string().max(80).trim().default(""),
  website:  z.string().url().optional().or(z.literal("")),
  phone:    z.string().max(30).trim().default(""),
  address:  z.string().max(200).trim().default(""),
  notes:    z.string().default(""),
  tags:     z.array(z.string()).default([]),
});

// GET /api/companies?search=&page=1&limit=25
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { search = "", page = "1", limit = "25" } = req.query;
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 25);
    const query    = {};

    if (search.trim()) {
      query.$or = [{ name: new RegExp(search.trim(), "i") }];
    }

    const [companies, total] = await Promise.all([
      Company.find(query)
        .populate("owner", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Company.countDocuments(query),
    ]);

    // Attach contact count per company
    const ids   = companies.map((c) => c._id);
    const counts = await Contact.aggregate([
      { $match: { company: { $in: ids } } },
      { $group: { _id: "$company", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((x) => [x._id.toString(), x.count]));

    const result = companies.map((c) => ({
      ...c.toObject(),
      contactCount: countMap[c._id.toString()] || 0,
    }));

    res.json({ companies: result, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) { next(err); }
});

// GET /api/companies/:id
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate("owner", "firstName lastName");
    if (!company) return res.status(404).json({ message: "Company not found" });

    const contacts = await Contact.find({ company: company._id })
      .select("firstName lastName email phone status")
      .limit(50);

    res.json({ ...company.toObject(), contacts });
  } catch (err) { next(err); }
});

// POST /api/companies
router.post("/", authRequired, validate(companySchema), async (req, res, next) => {
  try {
    const company = await Company.create({ ...req.body, owner: req.user.id });
    res.status(201).json(company);
  } catch (err) { next(err); }
});

// PATCH /api/companies/:id
router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true }
    );
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.json(company);
  } catch (err) { next(err); }
});

// DELETE /api/companies/:id
router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const c = await Company.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ message: "Company not found" });
    // Unlink contacts from this company
    await Contact.updateMany({ company: c._id }, { $unset: { company: "" } });
    res.json({ message: "Company deleted" });
  } catch (err) { next(err); }
});

export default router;
