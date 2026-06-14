import logger from "./logger.js";

const SLACK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Post a message to Slack via an Incoming Webhook.
 * Silent no-op if SLACK_WEBHOOK_URL is not configured.
 */
export async function sendSlack(text, blocks) {
  if (!SLACK_URL) return;

  try {
    const body = blocks ? { text, blocks } : { text };
    const res  = await fetch(SLACK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      logger.warn(`Slack webhook returned ${res.status}`);
    }
  } catch (err) {
    logger.error(`Slack notification failed: ${err.message}`);
  }
}

export async function slackNewTicket(ticket) {
  await sendSlack(`🎫 *New Ticket* — ${ticket.ticketNumber}`, [
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Ticket*\n${ticket.ticketNumber}` },
        { type: "mrkdwn", text: `*Customer*\n${ticket.customerName}` },
        { type: "mrkdwn", text: `*Email*\n${ticket.customerEmail}` },
        { type: "mrkdwn", text: `*Phone*\n${ticket.customerPhone}` },
      ],
    },
  ]);
}

export async function slackMissedChat(ticket, agentName) {
  await sendSlack(
    `🔴 *Missed Chat* — ${ticket.ticketNumber} (assigned to ${agentName})`
  );
}

export async function slackTicketAssigned(ticket, agentName) {
  await sendSlack(
    `📌 *Ticket Assigned* — ${ticket.ticketNumber} → ${agentName}`
  );
}
