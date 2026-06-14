import nodemailer from "nodemailer";
import logger from "./logger.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) return null; // SMTP not configured → silent no-op

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

const FROM = process.env.SMTP_FROM || "Hubly CRM <noreply@hubly.app>";

/**
 * Notify an agent that a chat was missed.
 * Silently skips if SMTP is not configured.
 */
export async function sendMissedChatAlert(ticket, agent) {
  const t = getTransporter();
  if (!t) return;

  try {
    await t.sendMail({
      from: FROM,
      to: agent.email,
      subject: `[Hubly] Missed Chat — ${ticket.ticketNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px">
          <h2 style="color:#e74c3c">Missed Chat Alert</h2>
          <p>A customer waited too long without a response and their chat was flagged as missed.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px;font-weight:bold">Ticket</td><td style="padding:6px">${ticket.ticketNumber}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Customer</td><td style="padding:6px">${ticket.customerName}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Email</td><td style="padding:6px">${ticket.customerEmail}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Phone</td><td style="padding:6px">${ticket.customerPhone}</td></tr>
          </table>
          <p style="margin-top:16px">Please follow up as soon as possible.</p>
        </div>
      `,
    });
    logger.info(
      `Missed chat email sent — ticket ${ticket.ticketNumber} → ${agent.email}`
    );
  } catch (err) {
    logger.error(`Failed to send missed chat email: ${err.message}`);
  }
}

/**
 * Notify an agent that a ticket was assigned to them.
 * Silently skips if SMTP is not configured.
 */
export async function sendTicketAssigned(ticket, agent) {
  const t = getTransporter();
  if (!t) return;

  try {
    await t.sendMail({
      from: FROM,
      to: agent.email,
      subject: `[Hubly] New Ticket Assigned — ${ticket.ticketNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px">
          <h2 style="color:#2980b9">New Ticket Assigned to You</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px;font-weight:bold">Ticket</td><td style="padding:6px">${ticket.ticketNumber}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Customer</td><td style="padding:6px">${ticket.customerName}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Email</td><td style="padding:6px">${ticket.customerEmail}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Phone</td><td style="padding:6px">${ticket.customerPhone}</td></tr>
          </table>
          <p style="margin-top:16px">Log in to Hubly CRM to view and respond to this ticket.</p>
        </div>
      `,
    });
    logger.info(
      `Ticket assigned email sent — ticket ${ticket.ticketNumber} → ${agent.email}`
    );
  } catch (err) {
    logger.error(`Failed to send ticket assigned email: ${err.message}`);
  }
}
