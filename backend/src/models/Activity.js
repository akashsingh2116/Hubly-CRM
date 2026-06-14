import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["note", "call", "email", "meeting"],
      required: true,
      default: "note",
    },

    title: { type: String, trim: true, default: "" },
    body:  { type: String, trim: true, default: "" },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Polymorphic link — at least one should be set
    contact: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    deal:    { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    ticket:  { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },

    // For ticket notes: true = visible only to agents
    isInternal: { type: Boolean, default: false },

    scheduledAt:     { type: Date },
    durationMinutes: { type: Number, min: 0 },
    outcome:         { type: String, default: "" },
  },
  { timestamps: true }
);

activitySchema.index({ contact: 1, createdAt: -1 });
activitySchema.index({ deal: 1, createdAt: -1 });
activitySchema.index({ ticket: 1, isInternal: 1, createdAt: -1 });
activitySchema.index({ owner: 1 });

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
