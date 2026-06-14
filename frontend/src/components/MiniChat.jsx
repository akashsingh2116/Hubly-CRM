import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const DEFAULT_SETTINGS = {
  headerColor:    "#1f3c5c",
  backgroundColor: "#f3f4f7",
  messageLine1:   "How may I help you?",
  messageLine2:   "Ask me anything!",
  welcomeMessage: "Want to chat about Hubly? I'm a chatbot here to help you find your way.",
};

const TYPING_DEBOUNCE_MS = 1500;

export default function MiniChat() {
  const [isOpen,      setIsOpen]      = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [step,        setStep]        = useState("form"); // "form" | "chat"

  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [ticket,   setTicket]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");

  const [settings,     setSettings]     = useState(DEFAULT_SETTINGS);
  const [agentTyping,  setAgentTyping]  = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  const socketRef      = useRef(null);
  const typingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ── Load settings from backend ────────────────────────────────────────────
  useEffect(() => {
    async function loadSettings() {
      try {
        const res  = await fetch(`${API_BASE}/api/chatbot/settings`);
        if (!res.ok) throw new Error("Settings API failed");
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        try {
          window.localStorage.setItem(
            "hubly_chatbot_settings",
            JSON.stringify({ ...DEFAULT_SETTINGS, ...data })
          );
        } catch {}
      } catch {
        try {
          const raw = window.localStorage.getItem("hubly_chatbot_settings");
          if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        } catch {}
      }
    }
    loadSettings();
  }, []);

  // Auto-hide tooltip
  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Socket: connect when a chat is started ────────────────────────────────
  useEffect(() => {
    if (!ticket?._id || step !== "chat") return;

    const socket = io(API_BASE, {
      auth:           {},           // no JWT — customer connection
      reconnection:   true,
      reconnectionDelay: 1000,
      transports:     ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-ticket", ticket._id);
    });

    socket.on("new-message", (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
      setAgentTyping(false);
    });

    socket.on("typing-start", ({ senderType }) => {
      if (senderType === "agent") setAgentTyping(true);
    });

    socket.on("typing-stop", ({ senderType }) => {
      if (senderType === "agent") setAgentTyping(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [ticket, step]);

  // ── Open / close ──────────────────────────────────────────────────────────
  const handleOpen = () => {
    try {
      const raw = window.localStorage.getItem("hubly_chatbot_settings");
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {}
    setIsOpen(true);
    setShowTooltip(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("form");
    setName(""); setPhone(""); setEmail("");
    setTicket(null);
    setMessages([]);
    setInput("");
    setAgentTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketRef.current?.disconnect();
    socketRef.current = null;
  };

  // ── Submit intro form ─────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/public/chat/start`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, phone, email }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to start chat");
      }

      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
      setStep("chat");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Send message as customer ──────────────────────────────────────────────
  async function handleSend(e) {
    e?.preventDefault();
    if (!ticket || !input.trim()) return;

    const text = input.trim();
    setInput("");

    // Stop typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketRef.current?.emit("typing-stop", { ticketId: ticket._id });

    try {
      const res = await fetch(
        `${API_BASE}/api/public/chat/${ticket._id}/messages`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ text }),
        }
      );

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to send");
      }

      const saved = await res.json();
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === saved._id);
        return exists ? prev : [...prev, saved];
      });
    } catch (err) {
      alert(err.message);
    }
  }

  // ── Typing (debounced) ────────────────────────────────────────────────────
  function handleInputChange(e) {
    setInput(e.target.value);
    if (!ticket?._id) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketRef.current?.emit("typing-start", { ticketId: ticket._id });

    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("typing-stop", { ticketId: ticket._id });
    }, TYPING_DEBOUNCE_MS);
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  function renderBubble(m) {
    const isCustomer  = m.senderType === "customer" || m.senderType === "user";
    const rowClass    = "mini-msg-row " + (isCustomer ? "mini-msg-row--user" : "mini-msg-row--agent");
    const bubbleClass = "mini-msg-bubble " + (isCustomer ? "mini-msg-bubble-user" : "mini-msg-bubble-agent");

    return (
      <div key={m._id} className={rowClass}>
        <div className={bubbleClass}>
          {m.text}
          {m.attachments?.map((att, i) => (
            <div key={i} style={{ marginTop: 4 }}>
              {att.mimetype?.startsWith("image/") ? (
                <a href={att.url} target="_blank" rel="noreferrer">
                  <img src={att.url} alt={att.originalName} style={{ maxWidth: 180, borderRadius: 4 }} />
                </a>
              ) : (
                <a href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                  📎 {att.originalName || att.filename}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="chat-widget-root">
      {isOpen && (
        <div
          className="chat-popup"
          style={{ backgroundColor: settings.backgroundColor || "#f3f4f7" }}
        >
          <header
            className="chat-popup-header"
            style={{ backgroundColor: settings.headerColor || "#1f3c5c" }}
          >
            <div className="chat-popup-avatar" />
            <div className="chat-popup-title">Hubly</div>
            <button className="chat-popup-close" onClick={handleClose}>×</button>
          </header>

          <div
            className="chat-popup-body"
            style={{ backgroundColor: settings.backgroundColor || "#f3f4f7" }}
          >
            {step === "form" ? (
              <div className="mini-initial-wrapper">
                <div className="mini-agent-row">
                  <div className="mini-agent-avatar" />
                  <div className="mini-agent-bubbles">
                    <div className="mini-agent-bubble">
                      <div className="mini-agent-title">
                        {settings.messageLine1 || "How can I help you?"}
                      </div>
                      {settings.messageLine2 && (
                        <div className="mini-agent-sub">{settings.messageLine2}</div>
                      )}
                    </div>
                  </div>
                </div>

                <form className="chat-form mini-intro-card" onSubmit={handleSubmit}>
                  <div className="chat-form-title">Introduction Yourself</div>

                  <label className="chat-form-field">
                    <span>Your name</span>
                    <input required value={name} onChange={(e) => setName(e.target.value)} />
                  </label>
                  <label className="chat-form-field">
                    <span>Your Phone</span>
                    <input required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </label>
                  <label className="chat-form-field">
                    <span>Your Email</span>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </label>

                  <button type="submit" className="chat-submit-btn" disabled={submitting}>
                    {submitting ? "Starting…" : (settings.introSubmitLabel || "Thank You!")}
                  </button>
                </form>
              </div>
            ) : (
              <div className="chat-conversation">
                <div className="mini-msg-list">
                  {messages.map((m) => renderBubble(m))}

                  {/* Agent typing indicator */}
                  {agentTyping && (
                    <div className="mini-msg-row mini-msg-row--agent">
                      <div className="mini-msg-bubble mini-msg-bubble-agent mini-typing">
                        <span className="cc-typing-dot" />
                        <span className="cc-typing-dot" />
                        <span className="cc-typing-dot" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          <footer className="chat-popup-footer">
            <input
              className="chat-footer-input"
              placeholder="Write a message"
              disabled={step !== "chat"}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && step === "chat") {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button
              className="chat-footer-send"
              type="button"
              disabled={step !== "chat" || !input.trim()}
              onClick={handleSend}
            />
          </footer>
        </div>
      )}

      {!isOpen && showTooltip && (
        <div className="chat-tooltip">
          <p>{settings.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage}</p>
        </div>
      )}

      <button className="chat-launcher" onClick={handleOpen}>
        <div className="chat-launcher-face" />
      </button>

      {!isOpen && showTooltip && (
        <button
          className="chat-tooltip-close"
          onClick={() => setShowTooltip(false)}
        >
          ×
        </button>
      )}
    </div>
  );
}
