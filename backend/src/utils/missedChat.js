// backend/src/utils/missedChat.js
import ChatbotSettings from "../models/ChatbotSettings.js";
import Ticket from "../models/Ticket.js";

let cachedSettings = null;

async function getThresholdSeconds() {
  if (!cachedSettings) {
    cachedSettings = await ChatbotSettings.getSingleton();
  }
  return cachedSettings.missedChatThresholdSeconds || 600; // default 10 min
}

/**
 * Ensure a single ticket has correct isMissed / missedAt based on:
 * - firstMessageAt
 * - firstResponseAt
 * - missedChatThresholdSeconds
 */
export async function updateMissedStatusForTicket(ticket) {
  if (!ticket.firstMessageAt) return ticket;          // no first message = can't be missed
  if (ticket.firstResponseAt) return ticket;         // already answered
  if (ticket.status === "resolved") return ticket;   // closed anyway

  const threshold = await getThresholdSeconds();
  const diffSeconds =
    (Date.now() - ticket.firstMessageAt.getTime()) / 1000;

  if (diffSeconds >= threshold && !ticket.isMissed) {
    ticket.isMissed = true;
    ticket.missedAt = new Date();
    await ticket.save();
  }

  return ticket;
}

/**
 * Helper for lists: make sure all given tickets have fresh missed flags.
 */
export async function updateMissedStatusForTickets(tickets) {
  await Promise.all(tickets.map((t) => updateMissedStatusForTicket(t)));
  return tickets;
}
