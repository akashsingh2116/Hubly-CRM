// backend/src/models/Ticket.js
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    // Human readable ticket number: e.g. HUB-0001
    ticketNumber: { type: String, required: true, unique: true },

    // Customer details from landing widget
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },

    // Where this ticket came from (widget, manual, etc.)
    source: {
      type: String,
      enum: ["widget", "manual", "other"],
      default: "widget",
    },

    // Assigned teammate (admin or member)
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

    // When the ticket was marked resolved
    resolvedAt: { type: Date },

    // First customer message time
    firstMessageAt: { type: Date },

    // First teammate reply time
    firstResponseAt: { type: Date },

    // 🔴 MISSED CHAT FIELDS
    isMissed: { type: Boolean, default: false },
    missedAt: { type: Date },

    // For dashboard list: last message snippet + time + who
    lastMessageAt: { type: Date },
    lastMessageSnippet: { type: String },
    lastMessageFrom: {
      type: String,
      enum: ["customer", "agent"],
    },
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
