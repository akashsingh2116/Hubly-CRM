import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url:          { type: String, required: true },
    filename:     { type: String, required: true },
    originalName: { type: String },
    mimetype:     { type: String },
    size:         { type: Number },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    senderType: {
      type: String,
      enum: ["agent", "customer"],
      required: true,
      default: "agent",
    },
    // Reference to the User who sent this message (agents only)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Validate that at least text or one attachment exists
messageSchema.pre("save", function (next) {
  if (!this.text && this.attachments.length === 0) {
    return next(new Error("Message must have text or at least one attachment"));
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
messageSchema.index({ ticket: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
