import ChatbotSettings from "../models/ChatbotSettings.js";
import { sendMissedChatAlert } from "./email.js";
import User from "../models/User.js";

let cachedThresholdSeconds = null;

export function invalidateSettingsCache() {
  cachedThresholdSeconds = null;
}

async function getThresholdSeconds() {
  if (cachedThresholdSeconds !== null) return cachedThresholdSeconds;
  const settings = await ChatbotSettings.getSingleton();
  cachedThresholdSeconds = settings.missedChatThresholdSeconds || 600;
  return cachedThresholdSeconds;
}

export async function updateMissedStatusForTicket(ticket) {
  if (!ticket.firstMessageAt)      return ticket;
  if (ticket.firstResponseAt)      return ticket;
  if (ticket.status === "resolved") return ticket;

  const threshold  = await getThresholdSeconds();
  const diffSeconds = (Date.now() - ticket.firstMessageAt.getTime()) / 1000;

  if (diffSeconds >= threshold && !ticket.isMissed) {
    ticket.isMissed = true;
    ticket.missedAt = new Date();
    await ticket.save();

    // Fire-and-forget email to the assigned agent
    try {
      const agent = await User.findById(ticket.assignedTo);
      if (agent) sendMissedChatAlert(ticket, agent).catch(() => {});
    } catch {
      // Non-critical — don't let email errors break the response
    }
  }

  return ticket;
}

export async function updateMissedStatusForTickets(tickets) {
  await Promise.all(tickets.map((t) => updateMissedStatusForTicket(t)));
  return tickets;
}
