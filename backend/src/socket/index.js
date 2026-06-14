import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

let io = null;

export function initSocket(httpServer) {
  const allowedOrigin =
    process.env.CORS_ORIGIN || "http://localhost:5173";

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Optional auth middleware — agents pass a JWT token; customers connect without one
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = { id: payload.id, role: payload.role };
      } catch {
        // Invalid token — treat as unauthenticated (customer widget)
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    const identity = socket.user
      ? `agent:${socket.user.id}`
      : `guest:${socket.id}`;
    logger.info(`Socket connected — ${identity}`);

    // Authenticated agents auto-join their personal room for notifications
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Join a specific ticket room
    socket.on("join-ticket", (ticketId) => {
      if (!ticketId) return;
      socket.join(`ticket:${ticketId}`);
      logger.debug(`Socket ${socket.id} joined ticket:${ticketId}`);
    });

    // Leave a ticket room
    socket.on("leave-ticket", (ticketId) => {
      if (!ticketId) return;
      socket.leave(`ticket:${ticketId}`);
    });

    // Typing: broadcast to everyone else in the room
    socket.on("typing-start", ({ ticketId }) => {
      if (!ticketId) return;
      const senderType = socket.user ? "agent" : "customer";
      socket.to(`ticket:${ticketId}`).emit("typing-start", { senderType });
    });

    socket.on("typing-stop", ({ ticketId }) => {
      if (!ticketId) return;
      const senderType = socket.user ? "agent" : "customer";
      socket.to(`ticket:${ticketId}`).emit("typing-stop", { senderType });
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected — ${identity}`);
    });
  });

  return io;
}

export function getIO() {
  return io; // returns null if not yet initialized — callers should guard
}

/**
 * Broadcast a new message to everyone in the ticket room.
 * Safe to call even before socket init (no-op if io is null).
 */
export function emitNewMessage(ticketId, message) {
  io?.to(`ticket:${ticketId}`).emit("new-message", message);
}

/**
 * Broadcast a ticket update (status change, reassignment, etc.).
 */
export function emitTicketUpdated(ticketId, ticket) {
  io?.to(`ticket:${ticketId}`).emit("ticket-updated", ticket);
}
