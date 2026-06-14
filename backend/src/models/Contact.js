import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, trim: true, default: "" },
    email:     { type: String, trim: true, lowercase: true },
    phone:     { type: String, trim: true, default: "" },

    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    status: {
      type: String,
      enum: ["lead", "prospect", "customer", "churned", "inactive"],
      default: "lead",
    },

    source: {
      type: String,
      enum: ["widget", "manual", "import", "referral", "other"],
      default: "manual",
    },

    tags:  { type: [String], default: [] },
    notes: { type: String, default: "" },

    customFields: {
      type: Map,
      of: String,
      default: {},
    },

    linkedTickets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
  },
  { timestamps: true }
);

contactSchema.index({ email: 1 });
contactSchema.index({ owner: 1 });
contactSchema.index({ company: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ tags: 1 });
contactSchema.index({ firstName: "text", lastName: "text", email: "text" });

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;
