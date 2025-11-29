// backend/src/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    senderType: {
      type: String,
      enum: ["agent", "customer"],
      required: true,
      default: "agent",
    },
    // for agents we keep a reference to User
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
