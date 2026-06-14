import express from "express";
import { z } from "zod";
import Task from "../models/Task.js";
import { authRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createNotification } from "../utils/notification.js";

const router = express.Router();

const taskSchema = z.object({
  title:       z.string().min(1).max(200).trim(),
  description: z.string().default(""),
  assignedTo:  z.string().min(1),
  dueDate:     z.string().optional(),
  priority:    z.enum(["low","medium","high","urgent"]).default("medium"),
  status:      z.enum(["todo","in_progress","done"]).default("todo"),
  contact:     z.string().optional(),
  deal:        z.string().optional(),
  ticket:      z.string().optional(),
});

// GET /api/tasks?assignedTo=me|<userId>&status=&page=1&limit=25
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { status, page = "1", limit = "25", assignedTo } = req.query;
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 25);
    const query    = {};

    if (assignedTo === "me") query.assignedTo = req.user.id;
    else if (assignedTo)     query.assignedTo = assignedTo;

    if (status) query.status = status;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate("assignedTo", "firstName lastName")
        .populate("createdBy", "firstName lastName")
        .populate("contact", "firstName lastName")
        .populate("deal", "title")
        .sort({ dueDate: 1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Task.countDocuments(query),
    ]);

    res.json({ tasks, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) { next(err); }
});

// POST /api/tasks
router.post("/", authRequired, validate(taskSchema), async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user.id });

    // Notify assignee (if different from creator)
    if (task.assignedTo.toString() !== req.user.id) {
      createNotification({
        userId: task.assignedTo,
        type:   "system",
        title:  `New Task: ${task.title}`,
        body:   task.description || "",
        link:   "/dashboard/tasks",
        data:   { taskId: task._id },
      }).catch(() => {});
    }

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName");

    res.status(201).json(populated);
  } catch (err) { next(err); }
});

// PATCH /api/tasks/:id
router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    Object.assign(task, req.body);
    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName");

    res.json(populated);
  } catch (err) { next(err); }
});

// DELETE /api/tasks/:id
router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const t = await Task.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) { next(err); }
});

export default router;
