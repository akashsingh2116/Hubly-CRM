import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import { authRequired, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/users/me
 * Get current logged-in user's profile
 */
router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/users/me
 * Update own profile (Settings page)
 * - can change firstName, lastName, phone
 * - if password is changed, we'll handle logout logic later on frontend
 */
router.patch("/me", authRequired, async (req, res) => {
  try {
    const { firstName, lastName, phone, password } = req.body;

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;

    let passwordChanged = false;
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.passwordHash = passwordHash;
      passwordChanged = true;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // frontend will see this flag and force logout if true
    res.json({ user, passwordChanged });
  } catch (err) {
    console.error("PATCH /me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/users
 * Team page list
 * - Admin and Members can see full list
 */
router.get("/", authRequired, async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ firstName: 1, lastName: 1 });
    res.json(users);
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/users
 * Admin adds a new team member
 * RULES:
 * - Only admin can call
 * - New user is always role "member"
 * - Password must be same as email (per your requirement)
 */
// POST /api/users
router.post("/", authRequired, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    // ✅ Only these 3 are required
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Password = email (your rule)
    const rawPassword = email;
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: phone || "", // phone optional
      role: "member",     // always member
      passwordHash
    });

    res.status(201).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (err) {
    console.error("POST /users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



/**
 * PATCH /api/users/:id
 * Admin edits an existing team member
 * RULES:
 * - Cannot edit admin user (no change of role, no editing admin row)
 * - Only firstName, lastName, phone can be changed here
 *   (email & role remain fixed)
 */
router.patch("/:id", authRequired, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin cannot be edited" });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (err) {
    console.error("PATCH /users/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /api/users/:id
 * Admin deletes a team member
 * RULES:
 * - Cannot delete admin
 * - Before deleting member, reassign all their tickets to admin
 */
router.delete("/:id", authRequired, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin cannot be deleted" });
    }

    // find the admin
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res
        .status(500)
        .json({ message: "No admin found to reassign tickets" });
    }

    // reassign tickets assigned to this member back to admin
    await Ticket.updateMany(
      { assignedTo: user._id },
      { $set: { assignedTo: admin._id } }
    );

    // delete user
    await User.deleteOne({ _id: user._id });

    res.json({ message: "Team member deleted and tickets reassigned to admin" });
  } catch (err) {
    console.error("DELETE /users/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
