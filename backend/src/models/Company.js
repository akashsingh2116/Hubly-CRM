import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    industry: { type: String, trim: true, default: "" },
    website:  { type: String, trim: true, default: "" },
    phone:    { type: String, trim: true, default: "" },
    address:  { type: String, trim: true, default: "" },
    notes:    { type: String, default: "" },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    tags: { type: [String], default: [] },

    customFields: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

companySchema.index({ owner: 1 });
companySchema.index({ name: "text" });

const Company = mongoose.model("Company", companySchema);
export default Company;
