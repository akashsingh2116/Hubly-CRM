// src/components/MiniChat.jsx
import React, { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

const DEFAULT_SETTINGS = {
  headerColor: "#1f3c5c",
  backgroundColor: "#f3f4f7",
  messageLine1: "How may I help you?",
  messageLine2: "Ask me anything!",
  welcomeMessage:
    "Want to chat about Hubly? I'm a chatbot here to help you find your way.",
};

export default function MiniChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const [step, setStep] = useState("form"); // "form" → "chat"

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // helper: sync from localStorage (what ChatBot saves)
  function syncSettingsFromStorage() {
    try {
      const raw = window.localStorage.getItem("hubly_chatbot_settings");
      if (!raw) {
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      const parsed = JSON.parse(raw);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...parsed,
      });
    } catch (e) {
      console.error("Failed to load chatbot settings", e);
      setSettings(DEFAULT_SETTINGS);
    }
  }

  // ✅ NEW: load from backend (Mongo) first, then fall back to localStorage
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE}/api/chatbot/settings`);
        if (!res.ok) {
          throw new Error("Settings API not ok");
        }

        const data = await res.json();
        const merged = {
          ...DEFAULT_SETTINGS,
          headerColor: data.headerColor || DEFAULT_SETTINGS.headerColor,
          backgroundColor:
            data.backgroundColor || DEFAULT_SETTINGS.backgroundColor,
          messageLine1: data.messageLine1 || DEFAULT_SETTINGS.messageLine1,
          messageLine2: data.messageLine2 || DEFAULT_SETTINGS.messageLine2,
          welcomeMessage:
            data.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
        };

        setSettings(merged);

        // also mirror into localStorage for this browser
        try {
          window.localStorage.setItem(
            "hubly_chatbot_settings",
            JSON.stringify(merged)
          );
        } catch (e) {
          console.warn("Failed to write chatbot settings to localStorage", e);
        }
      } catch (err) {
        console.warn(
          "MiniChat: failed to load settings from API; falling back to localStorage",
          err
        );
        // fallback: your existing behavior
        syncSettingsFromStorage();
      }
    }

    loadSettings();
  }, []);

  // auto-hide tooltip
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    // re-read settings so changes from ChatBot page are picked up in this browser
    syncSettingsFromStorage();
    setIsOpen(true);
    setShowTooltip(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("form");
    setName("");
    setPhone("");
    setEmail("");
    setTicket(null);
    setMessages([]);
    setInput("");
  };

  // start chat via form
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/api/public/chat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to start chat");
      }

      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
      setStep("chat");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // send message as customer
  async function handleSend(e) {
    e.preventDefault();
    if (!ticket || !input.trim()) return;

    const text = input.trim();
    setInput("");

    try {
      const res = await fetch(
        `${API_BASE}/api/public/chat/${ticket._id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send message");
      }

      const saved = await res.json();
      setMessages((prev) => [...prev, saved]);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // poll for new messages while chatting
  useEffect(() => {
    if (!ticket?._id || step !== "chat") return;

    async function loadMessages() {
      try {
        const res = await fetch(
          `${API_BASE}/api/public/chat/${ticket._id}/messages`
        );
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data || []);
      } catch (e) {
        console.error("Failed to load widget messages", e);
      }
    }

    loadMessages();
    const id = setInterval(loadMessages, 3000);
    return () => clearInterval(id);
  }, [ticket, step]);

  function renderBubble(m) {
    const isCustomer = m.senderType === "customer" || m.senderType === "user";
    const rowClass =
      "mini-msg-row " +
      (isCustomer ? "mini-msg-row--user" : "mini-msg-row--agent");
    const bubbleClass =
      "mini-msg-bubble " +
      (isCustomer ? "mini-msg-bubble-user" : "mini-msg-bubble-agent");

    return (
      <div key={m._id} className={rowClass}>
        <div className={bubbleClass}>{m.text}</div>
      </div>
    );
  }

  return (
    <div className="chat-widget-root">
      {isOpen && (
        <div
          className="chat-popup"
          style={{
            backgroundColor: settings.backgroundColor || "#f3f4f7",
          }}
        >
          <header
            className="chat-popup-header"
            style={{
              backgroundColor: settings.headerColor || "#1f3c5c",
            }}
          >
            <div className="chat-popup-avatar" />
            <div className="chat-popup-title">Hubly</div>
            <button className="chat-popup-close" onClick={handleClose}>
              ×
            </button>
          </header>

          <div
            className="chat-popup-body"
            style={{
              backgroundColor: settings.backgroundColor || "#f3f4f7",
            }}
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
                        <div className="mini-agent-sub">
                          {settings.messageLine2}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <form
                  className="chat-form mini-intro-card"
                  onSubmit={handleSubmit}
                >
                  <div className="chat-form-title">Introduction Yourself</div>

                  <label className="chat-form-field">
                    <span>Your name</span>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>

                  <label className="chat-form-field">
                    <span>Your Phone</span>
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>

                  <label className="chat-form-field">
                    <span>Your Email</span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>

                  <button type="submit" className="chat-submit-btn">
                    Thank You!
                  </button>
                </form>
              </div>
            ) : (
              <div className="chat-conversation">
                {messages.length === 0 ? (
                  <div className="mini-empty">Starting chat…</div>
                ) : (
                  <div className="mini-msg-list">
                    {messages.map((m) => renderBubble(m))}
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="chat-popup-footer">
            <input
              className="chat-footer-input"
              placeholder="Write a message"
              disabled={step !== "chat"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (step === "chat") handleSend(e);
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
