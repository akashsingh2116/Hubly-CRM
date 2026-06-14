import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: [
        "ticket_assigned",
        "ticket_missed",
        "new_message",
        "task_due",
        "deal_updated",
        "mention",
        "system",
      ],
      required: true,
    },

    title: { type: String, required: true },
    body:  { type: String, default: "" },
    link:  { type: String, default: "" }, // e.g., "/dashboard/contact-center"

    isRead: { type: Boolean, default: false },
    data:   { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
