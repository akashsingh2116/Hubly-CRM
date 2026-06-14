import SlaPolicy from "../models/SlaPolicy.js";
import Ticket from "../models/Ticket.js";
import { createNotification } from "./notification.js";
import logger from "./logger.js";

let defaultPolicyCache = null;

export function invalidateSlaPolicyCache() {
  defaultPolicyCache = null;
}

async function getDefaultPolicy() {
  if (defaultPolicyCache) return defaultPolicyCache;
  const policy = await SlaPolicy.findOne({ isDefault: true });
  defaultPolicyCache = policy;
  return policy;
}

/**
 * Check SLA breach status for a ticket.
 * Mutates the ticket document and saves if a breach is newly detected.
 */
export async function checkSla(ticket) {
  if (ticket.status === "resolved") return;

  const policy = ticket.slaPolicyId
    ? await SlaPolicy.findById(ticket.slaPolicyId)
    : await getDefaultPolicy();

  if (!policy) return;

  const now      = Date.now();
  const created  = new Date(ticket.createdAt).getTime();

  // First response SLA
  if (
    !ticket.firstResponseAt &&
    !ticket.slaFirstResponseBreachedAt &&
    policy.firstResponseTargetMinutes
  ) {
    const target = created + policy.firstResponseTargetMinutes * 60_000;
    if (now > target) {
      ticket.slaFirstResponseBreachedAt = new Date();
      await ticket.save();

      // Notify the assigned agent
      try {
        await createNotification({
          userId: ticket.assignedTo,
          type:   "system",
          title:  `SLA Breached — ${ticket.ticketNumber}`,
          body:   `First response time exceeded ${policy.firstResponseTargetMinutes} minutes.`,
          link:   "/dashboard/contact-center",
          data:   { ticketId: ticket._id },
        });
      } catch {}

      logger.warn(`SLA first-response breach on ticket ${ticket.ticketNumber}`);
    }
  }

  // Resolution SLA
  if (
    ticket.status !== "resolved" &&
    !ticket.slaResolutionBreachedAt &&
    policy.resolutionTargetMinutes
  ) {
    const target = created + policy.resolutionTargetMinutes * 60_000;
    if (now > target) {
      ticket.slaResolutionBreachedAt = new Date();
      await ticket.save();
      logger.warn(`SLA resolution breach on ticket ${ticket.ticketNumber}`);
    }
  }
}
