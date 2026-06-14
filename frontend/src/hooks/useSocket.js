import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { API_BASE } from "../apiClient";

/**
 * Creates and manages a Socket.io connection.
 * Agents connect with their JWT token (enables server-side identity).
 * Customers (public widget) connect without a token.
 *
 * @param {object} opts
 * @param {boolean} [opts.withAuth=true]  Pass false for the public chat widget.
 * @returns {{ socketRef, joinTicket, leaveTicket, emitTypingStart, emitTypingStop }}
 */
export function useSocket({ withAuth = true } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token  = withAuth ? localStorage.getItem("token") : null;
    const socket = io(API_BASE, {
      auth:                  token ? { token } : {},
      reconnection:          true,
      reconnectionDelay:     1000,
      reconnectionAttempts:  10,
      transports:            ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [withAuth]);

  const joinTicket = useCallback((ticketId) => {
    socketRef.current?.emit("join-ticket", ticketId);
  }, []);

  const leaveTicket = useCallback((ticketId) => {
    socketRef.current?.emit("leave-ticket", ticketId);
  }, []);

  const emitTypingStart = useCallback((ticketId) => {
    socketRef.current?.emit("typing-start", { ticketId });
  }, []);

  const emitTypingStop = useCallback((ticketId) => {
    socketRef.current?.emit("typing-stop", { ticketId });
  }, []);

  return { socketRef, joinTicket, leaveTicket, emitTypingStart, emitTypingStop };
}
