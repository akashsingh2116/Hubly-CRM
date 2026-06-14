import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    dueDate:  { type: Date },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },

    // Optional link to a CRM entity
    contact: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
    deal:    { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    ticket:  { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },

    completedAt: { type: Date },
  },
  { timestamps: true }
);

taskSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "done" && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdBy: 1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;
