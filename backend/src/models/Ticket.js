import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },

    customerName:  { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },

    source: {
      type: String,
      enum: ["widget", "manual", "other"],
      default: "widget",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },

    resolvedAt:      { type: Date },
    firstMessageAt:  { type: Date },
    firstResponseAt: { type: Date },

    isMissed: { type: Boolean, default: false },
    missedAt: { type: Date },

    lastMessageAt:      { type: Date },
    lastMessageSnippet: { type: String },
    lastMessageFrom: {
      type: String,
      enum: ["customer", "agent"],
    },

    labels: [{ type: String, trim: true }],

    slaPolicy:                  { type: mongoose.Schema.Types.ObjectId, ref: "SlaPolicy" },
    slaFirstResponseBreachedAt: { type: Date },
    slaResolutionBreachedAt:    { type: Date },

    contact: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
  },
  { timestamps: true }
);

// ── Indexes for common query patterns ─────────────────────────────────────────
ticketSchema.index({ status: 1, assignedTo: 1 });
ticketSchema.index({ assignedTo: 1, lastMessageAt: -1 });
ticketSchema.index({ customerEmail: 1 });
ticketSchema.index({ isMissed: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ lastMessageAt: -1 });

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
