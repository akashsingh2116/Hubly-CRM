import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // 🔹 phone is OPTIONAL now
    phone: {
      type: String,
      default: "",
      // DO NOT put "required: true" here
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
      required: true,
    },

    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

// virtual full name (optional helper)
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

const User = mongoose.model("User", userSchema);

export default User;
