import mongoose from "mongoose";

const VALID_EVENTS = [
  "ticket.created",
  "ticket.updated",
  "ticket.assigned",
  "ticket.status_changed",
  "ticket.missed",
  "message.created",
  "deal.created",
  "deal.updated",
  "contact.created",
];

const webhookSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    url:    { type: String, required: true, trim: true },
    events: {
      type: [String],
      enum: VALID_EVENTS,
      required: true,
    },
    secret:    { type: String, default: "" }, // for HMAC signature verification
    isActive:  { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastTriggeredAt: { type: Date },
    failCount:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

webhookSchema.statics.VALID_EVENTS = VALID_EVENTS;
webhookSchema.index({ isActive: 1 });

const Webhook = mongoose.model("Webhook", webhookSchema);
export default Webhook;
