import mongoose from "mongoose";

const chatbotAutomationSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },

    triggerType: {
      type: String,
      enum: ["keyword", "working_hours", "new_chat"],
      required: true,
    },

    // keyword trigger: case-insensitive match on any of these
    keywords: { type: [String], default: [] },

    // working_hours trigger
    workingHoursStart: { type: String, default: "09:00" }, // "HH:MM" 24h
    workingHoursEnd:   { type: String, default: "18:00" },
    workingHoursDays:  { type: [Number], default: [1,2,3,4,5] }, // 0=Sun..6=Sat

    // action: always reply with text for now
    replyText: { type: String, required: true },

    priority:  { type: Number, default: 0 }, // lower = runs first
  },
  { timestamps: true }
);

chatbotAutomationSchema.index({ isActive: 1, priority: 1 });

const ChatbotAutomation = mongoose.model("ChatbotAutomation", chatbotAutomationSchema);
export default ChatbotAutomation;
