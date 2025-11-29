// backend/src/models/ChatbotSettings.js
import mongoose from "mongoose";

const chatbotSettingsSchema = new mongoose.Schema(
  {
    headerColor: {
      type: String,
      default: "#33475B",
    },
    backgroundColor: {
      type: String,
      default: "#ffffff",
    },

    // Two custom messages in the chat body
    messageLine1: {
      type: String,
      default: "How can I help you?",
    },
    messageLine2: {
      type: String,
      default: "Ask me anything!",
    },

    // Intro form labels / placeholders
    introNameLabel: {
      type: String,
      default: "Your name",
    },
    introPhoneLabel: {
      type: String,
      default: "Your phone",
    },
    introEmailLabel: {
      type: String,
      default: "Your email",
    },
    introSubmitLabel: {
      type: String,
      default: "Thank You!",
    },

    // Welcome balloon on landing
    welcomeMessage: {
      type: String,
      default:
        "Want to chat about Hubly? I'm a chatbot here to help you find your way.",
    },

    // Missedchat threshold in seconds
    missedChatThresholdSeconds: {
      type: Number,
      default: 60, // you can change later
      min: 5,
    },
  },
  { timestamps: true }
);

// One singleton document
chatbotSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({});
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const ChatbotSettings = mongoose.model(
  "ChatbotSettings",
  chatbotSettingsSchema
);

export default ChatbotSettings;
