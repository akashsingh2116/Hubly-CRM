import mongoose from "mongoose";

const STAGE_PROBABILITIES = {
  lead:        10,
  qualified:   25,
  proposal:    50,
  negotiation: 75,
  closed_won:  100,
  closed_lost: 0,
};

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    contact: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    owner:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    stage: {
      type: String,
      enum: Object.keys(STAGE_PROBABILITIES),
      default: "lead",
    },

    value:    { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD", maxlength: 3 },

    closeDate:   { type: Date },
    probability: { type: Number, default: 10, min: 0, max: 100 },

    description: { type: String, default: "" },
    tags:        { type: [String], default: [] },
  },
  { timestamps: true }
);

// Auto-set probability when stage changes
dealSchema.pre("save", function (next) {
  if (this.isModified("stage")) {
    this.probability = STAGE_PROBABILITIES[this.stage] ?? this.probability;
  }
  next();
});

dealSchema.index({ owner: 1 });
dealSchema.index({ stage: 1 });
dealSchema.index({ closeDate: 1 });
dealSchema.index({ contact: 1 });
dealSchema.index({ company: 1 });
dealSchema.index({ title: "text" });

dealSchema.statics.STAGE_PROBABILITIES = STAGE_PROBABILITIES;
dealSchema.statics.STAGES = Object.keys(STAGE_PROBABILITIES);

const Deal = mongoose.model("Deal", dealSchema);
export default Deal;
