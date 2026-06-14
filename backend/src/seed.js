/**
 * Seed script — creates default admin + sample data if the DB is empty.
 * Run: node src/seed.js
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Ticket from "./models/Ticket.js";
import Message from "./models/Message.js";
import Contact from "./models/Contact.js";
import Company from "./models/Company.js";
import Deal from "./models/Deal.js";
import Task from "./models/Task.js";
import ChatbotSettings from "./models/ChatbotSettings.js";
import SlaPolicy from "./models/SlaPolicy.js";

const ADMIN_EMAIL    = "admin@hubly.io";
const ADMIN_PASSWORD = "Admin@1234";

async function seed() {
  await connectDB();
  console.log("✅ Connected to MongoDB");

  /* ── Admin user ────────────────────────────────────────────────────────── */
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    admin = await User.create({
      firstName: "Admin",
      lastName:  "Hubly",
      email:     ADMIN_EMAIL,
      phone:     "+1-555-000-0001",
      role:      "admin",
      passwordHash: hash,
    });
    console.log(`✅ Admin created — email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
  } else {
    console.log(`ℹ️  Admin already exists (${ADMIN_EMAIL})`);
  }

  /* ── Sample agents ─────────────────────────────────────────────────────── */
  const agentData = [
    { firstName: "Sara",  lastName: "Ramos", email: "sara@hubly.io",  phone: "+1-555-000-0002" },
    { firstName: "James", lastName: "Torres",email: "james@hubly.io", phone: "+1-555-000-0003" },
  ];
  const agents = [];
  for (const a of agentData) {
    let u = await User.findOne({ email: a.email });
    if (!u) {
      const hash = await bcrypt.hash("Agent@1234", 12);
      u = await User.create({ ...a, role: "member", passwordHash: hash });
      console.log(`✅ Agent created — ${a.email} / Agent@1234`);
    }
    agents.push(u);
  }

  /* ── Chatbot settings ──────────────────────────────────────────────────── */
  const cbCount = await ChatbotSettings.countDocuments();
  if (cbCount === 0) {
    await ChatbotSettings.create({
      headerColor: "#1f3c5c",
      backgroundColor: "#f3f4f7",
      messageLine1: "How can I help you?",
      messageLine2: "Ask me anything!",
      welcomeMessage: "Want to chat about Hubly? I'm a chatbot here to help you.",
      missedChatThresholdSeconds: 600,
    });
    console.log("✅ Default chatbot settings created");
  }

  /* ── Default SLA policy ────────────────────────────────────────────────── */
  const slaCount = await SlaPolicy.countDocuments();
  if (slaCount === 0) {
    await SlaPolicy.create({
      name: "Standard SLA",
      firstResponseMinutes: 60,
      resolutionMinutes: 480,
      isDefault: true,
      createdBy: admin._id,
    });
    console.log("✅ Default SLA policy created");
  }

  /* ── Sample companies ──────────────────────────────────────────────────── */
  const companyData = [
    { name: "NovaPay Inc.",    industry: "Fintech",  website: "https://novapay.io" },
    { name: "ShopDeck",        industry: "E-commerce", website: "https://shopdeck.com" },
    { name: "Helios Tech",     industry: "SaaS",      website: "https://helios.io" },
  ];
  const companies = [];
  for (const c of companyData) {
    let co = await Company.findOne({ name: c.name });
    if (!co) { co = await Company.create({ ...c, createdBy: admin._id }); console.log(`✅ Company: ${c.name}`); }
    companies.push(co);
  }

  /* ── Sample contacts ───────────────────────────────────────────────────── */
  const contactData = [
    { firstName: "Alex",  lastName: "Kim",    email: "alex@novapay.io",   phone: "+1-555-111-0001", company: companies[0]._id, status: "customer" },
    { firstName: "Maria", lastName: "Lopez",  email: "maria@shopdeck.com",phone: "+1-555-111-0002", company: companies[1]._id, status: "customer" },
    { firstName: "David", lastName: "Chen",   email: "david@helios.io",   phone: "+1-555-111-0003", company: companies[2]._id, status: "lead"     },
    { firstName: "Emma",  lastName: "Wilson", email: "emma@email.com",    phone: "+1-555-111-0004", status: "prospect" },
  ];
  const contacts = [];
  for (const c of contactData) {
    let ct = await Contact.findOne({ email: c.email });
    if (!ct) { ct = await Contact.create({ ...c, owner: admin._id }); console.log(`✅ Contact: ${c.firstName} ${c.lastName}`); }
    contacts.push(ct);
  }

  /* ── Sample deals ──────────────────────────────────────────────────────── */
  const dealCount = await Deal.countDocuments();
  if (dealCount === 0) {
    const dealData = [
      { title: "NovaPay Enterprise", stage: "proposal",    value: 12000, contact: contacts[0]._id, company: companies[0]._id, owner: admin._id },
      { title: "ShopDeck Growth",    stage: "negotiation", value: 4500,  contact: contacts[1]._id, company: companies[1]._id, owner: agents[0]._id },
      { title: "Helios Starter",     stage: "qualified",   value: 2400,  contact: contacts[2]._id, company: companies[2]._id, owner: agents[1]._id },
      { title: "Emma — Evaluation",  stage: "lead",        value: 800,   contact: contacts[3]._id, owner: admin._id },
    ];
    for (const d of dealData) {
      await Deal.create(d);
      console.log(`✅ Deal: ${d.title}`);
    }
  }

  /* ── Sample tasks ──────────────────────────────────────────────────────── */
  const taskCount = await Task.countDocuments();
  if (taskCount === 0) {
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 3);
    const taskData = [
      { title: "Follow up with NovaPay",    assignedTo: admin._id,    dueDate },
      { title: "Send proposal to ShopDeck", assignedTo: agents[0]._id, dueDate },
      { title: "Demo prep for Helios",      assignedTo: agents[1]._id, dueDate },
    ];
    for (const t of taskData) {
      await Task.create({ ...t, createdBy: admin._id });
      console.log(`✅ Task: ${t.title}`);
    }
  }

  /* ── Sample tickets ────────────────────────────────────────────────────── */
  const ticketCount = await Ticket.countDocuments();
  if (ticketCount === 0) {
    const ticketData = [
      { ticketNumber: "TKT-0001", customerName: "Alex Kim",    customerEmail: "alex@novapay.io",   customerPhone: "+1-555-111-0001", subject: "Billing question",   status: "open",        assignedTo: admin._id,     contact: contacts[0]._id },
      { ticketNumber: "TKT-0002", customerName: "Maria Lopez", customerEmail: "maria@shopdeck.com",customerPhone: "+1-555-111-0002", subject: "Integration help",   status: "open",        assignedTo: agents[0]._id, contact: contacts[1]._id },
      { ticketNumber: "TKT-0003", customerName: "David Chen",  customerEmail: "david@helios.io",   customerPhone: "+1-555-111-0003", subject: "Feature request",    status: "in-progress", assignedTo: agents[1]._id, contact: contacts[2]._id },
      { ticketNumber: "TKT-0004", customerName: "Emma Wilson", customerEmail: "emma@email.com",    customerPhone: "+1-555-111-0004", subject: "Onboarding support", status: "resolved",    assignedTo: admin._id,     resolvedAt: new Date() },
    ];
    for (const t of ticketData) {
      const ticket = await Ticket.create(t);

      // Seed initial message
      await Message.create({
        ticket:      ticket._id,
        senderType:  "customer",
        senderName:  t.customerName,
        senderEmail: t.customerEmail,
        text:        `Hi, I need help with: ${t.subject}. Could you please assist me?`,
      });

      // Agent reply
      await Message.create({
        ticket:     ticket._id,
        senderType: "agent",
        senderName: "Hubly Support",
        sender:     admin._id,
        text:       `Hello ${t.customerName.split(" ")[0]}, thanks for reaching out! We're looking into this and will get back to you shortly.`,
      });

      console.log(`✅ Ticket: ${t.subject} (${t.status})`);
    }
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("─────────────────────────────────────────");
  console.log("  🔐 Admin Login:");
  console.log(`     Email   : ${ADMIN_EMAIL}`);
  console.log(`     Password: ${ADMIN_PASSWORD}`);
  console.log("─────────────────────────────────────────");
  console.log("  👤 Agent Logins (password: Agent@1234):");
  console.log("     sara@hubly.io  (Sara Ramos)");
  console.log("     james@hubly.io (James Torres)");
  console.log("─────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
