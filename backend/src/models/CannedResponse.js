import mongoose from "mongoose";

const cannedResponseSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    shortcut: { type: String, trim: true, lowercase: true }, // e.g., "/greet"
    content:  { type: String, required: true },
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isGlobal: { type: Boolean, default: true }, // visible to all agents
  },
  { timestamps: true }
);

cannedResponseSchema.index({ shortcut: 1 });
cannedResponseSchema.index({ createdBy: 1 });
cannedResponseSchema.index({ name: "text", content: "text" });

const CannedResponse = mongoose.model("CannedResponse", cannedResponseSchema);
export default CannedResponse;
