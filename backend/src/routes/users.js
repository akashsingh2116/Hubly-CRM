import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import { authRequired, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// ── Validation schemas ────────────────────────────────────────────────────────
const addMemberSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName:  z.string().min(1).max(50).trim(),
  email:     z.string().email().toLowerCase().trim(),
  phone:     z.string().max(30).trim().optional().default(""),
});

const editMemberSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName:  z.string().min(1).max(50).trim().optional(),
  phone:     z.string().max(30).trim().optional(),
});

const updateSelfSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName:  z.string().min(1).max(50).trim().optional(),
  phone:     z.string().max(30).trim().optional(),
  password:  z.string().min(6).optional(),
});

// ── GET /api/users/me ─────────────────────────────────────────────────────────
router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/users/me ───────────────────────────────────────────────────────
router.patch("/me", authRequired, validate(updateSelfSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, phone, password } = req.body;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName  !== undefined) updates.lastName  = lastName;
    if (phone     !== undefined) updates.phone     = phone;

    let passwordChanged = false;
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 12);
      passwordChanged = true;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user, passwordChanged });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users ────────────────────────────────────────────────────────────
router.get("/", authRequired, async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ firstName: 1, lastName: 1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users ───────────────────────────────────────────────────────────
router.post("/", authRequired, requireAdmin, validate(addMemberSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(email, 12); // default password = email

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      role: "member",
      passwordHash,
    });

    res.status(201).json({
      id:        user._id,
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      phone:     user.phone,
      role:      user.role,
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/users/:id ──────────────────────────────────────────────────────
router.patch("/:id", authRequired, requireAdmin, validate(editMemberSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin user cannot be edited here" });
    }

    const { firstName, lastName, phone } = req.body;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName  !== undefined) user.lastName  = lastName;
    if (phone     !== undefined) user.phone     = phone;

    await user.save();

    res.json({
      id:        user._id,
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      phone:     user.phone,
      role:      user.role,
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
router.delete("/:id", authRequired, requireAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin cannot be deleted" });
    }

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(500).json({ message: "No admin found to reassign tickets" });
    }

    await Ticket.updateMany(
      { assignedTo: user._id },
      { $set: { assignedTo: admin._id } }
    );

    await User.deleteOne({ _id: user._id });

    res.json({ message: "Team member deleted and tickets reassigned to admin" });
  } catch (err) {
    next(err);
  }
});

export default router;
