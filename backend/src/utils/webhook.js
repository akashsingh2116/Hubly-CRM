import crypto from "crypto";
import Webhook from "../models/Webhook.js";
import logger from "./logger.js";

/**
 * Fire all active webhooks that subscribe to the given event.
 * Always call fire-and-forget (don't await in routes).
 *
 * @param {string} event  e.g. "ticket.created"
 * @param {object} payload  serialisable object to send as JSON body
 */
export async function triggerWebhooks(event, payload) {
  try {
    const hooks = await Webhook.find({ isActive: true, events: event });
    if (hooks.length === 0) return;

    const body      = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const timestamp = Math.floor(Date.now() / 1000).toString();

    await Promise.allSettled(
      hooks.map(async (hook) => {
        try {
          const headers = {
            "Content-Type": "application/json",
            "X-Hubly-Event":     event,
            "X-Hubly-Timestamp": timestamp,
          };

          if (hook.secret) {
            const sig = crypto
              .createHmac("sha256", hook.secret)
              .update(`${timestamp}.${body}`)
              .digest("hex");
            headers["X-Hubly-Signature"] = `sha256=${sig}`;
          }

          const res = await fetch(hook.url, {
            method: "POST",
            headers,
            body,
            signal: AbortSignal.timeout(10_000), // 10 s timeout
          });

          hook.lastTriggeredAt = new Date();
          if (!res.ok) {
            hook.failCount = (hook.failCount || 0) + 1;
            logger.warn(`Webhook ${hook._id} returned ${res.status} for event ${event}`);
          } else {
            hook.failCount = 0;
          }

          await hook.save();
        } catch (err) {
          logger.error(`Webhook ${hook._id} failed: ${err.message}`);
          await Webhook.findByIdAndUpdate(hook._id, {
            $inc: { failCount: 1 },
            lastTriggeredAt: new Date(),
          });
        }
      })
    );
  } catch (err) {
    logger.error(`triggerWebhooks error: ${err.message}`);
  }
}
