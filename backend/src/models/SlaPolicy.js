import mongoose from "mongoose";

const slaPolicySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstResponseTargetMinutes: { type: Number, default: 60, min: 1 },
    resolutionTargetMinutes:    { type: Number, default: 480, min: 1 },
    businessHoursOnly: { type: Boolean, default: false },
    isDefault:         { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SlaPolicy = mongoose.model("SlaPolicy", slaPolicySchema);
export default SlaPolicy;
