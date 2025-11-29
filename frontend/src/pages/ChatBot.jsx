// src/pages/ChatBot.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../apiClient";

export default function ChatBot() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // UI state
  const [headerColor, setHeaderColor] = useState("#1f3c5c");
  const [bgColor, setBgColor] = useState("#f3f4f7");
  const [primaryMsg, setPrimaryMsg] = useState("How can I help you?");
  const [secondaryMsg, setSecondaryMsg] = useState("Ask me anything!");
  const [welcomeMsg, setWelcomeMsg] = useState(
    "Want to chat about Hubly? I'm an chatbot here to help you find your way."
  );
  const [missedTimer, setMissedTimer] = useState({
    hours: "00",
    minutes: "10",
    seconds: "00",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headerSwatches = ["#ffffff", "#000000", "#1f3c5c"];
  const bgSwatches = ["#ffffff", "#000000", "#f3f4f7"];

  // ---------- helpers ----------

  function handleTimerChange(key, value) {
    if (value.length <= 2) {
      setMissedTimer((prev) => ({
        ...prev,
        [key]: value.replace(/\D/g, ""),
      }));
    }
  }

  function secondsToHMS(totalSeconds) {
    if (!totalSeconds || totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return {
      hours: String(h).padStart(2, "0"),
      minutes: String(m).padStart(2, "0"),
      seconds: String(s).padStart(2, "0"),
    };
  }

  function hmsToSeconds({ hours, minutes, seconds }) {
    const h = parseInt(hours || "0", 10) || 0;
    const m = parseInt(minutes || "0", 10) || 0;
    const s = parseInt(seconds || "0", 10) || 0;
    return h * 3600 + m * 60 + s;
  }

  function saveToLocalStorage(settingsObj) {
    try {
      window.localStorage.setItem(
        "hubly_chatbot_settings",
        JSON.stringify(settingsObj)
      );
    } catch (e) {
      console.error("Failed to save chatbot settings to localStorage", e);
    }
  }

  function handleHeaderColorInput(e) {
    let value = e.target.value.replace(/[^0-9a-fA-F]/g, "");
    if (value.length > 6) value = value.slice(0, 6);
    setHeaderColor("#" + value);
  }

  function handleBgColorInput(e) {
    let value = e.target.value.replace(/[^0-9a-fA-F]/g, "");
    if (value.length > 6) value = value.slice(0, 6);
    setBgColor("#" + value);
  }

  // ---------- load settings from backend ----------

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await api.get("/api/chatbot/settings");

        const header = data.headerColor || "#1f3c5c";
        const bg = data.backgroundColor || "#f3f4f7";
        const msg1 = data.messageLine1 || "How can I help you?";
        const msg2 = data.messageLine2 || "Ask me anything!";
        const welcome =
          data.welcomeMessage ||
          "Want to chat about Hubly? I'm an chatbot here to help you find your way.";
        const hms = secondsToHMS(data.missedChatThresholdSeconds || 600);

        setHeaderColor(header);
        setBgColor(bg);
        setPrimaryMsg(msg1);
        setSecondaryMsg(msg2);
        setWelcomeMsg(welcome);
        setMissedTimer(hms);

        // sync to localStorage for MiniChat
        saveToLocalStorage({
          headerColor: header,
          backgroundColor: bg,
          messageLine1: msg1,
          messageLine2: msg2,
          welcomeMessage: welcome,
        });
      } catch (err) {
        setError(err.message || "Failed to load chatbot settings");

        // fallback – read any localStorage
        try {
          const raw = window.localStorage.getItem("hubly_chatbot_settings");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.headerColor) setHeaderColor(parsed.headerColor);
            if (parsed.backgroundColor) setBgColor(parsed.backgroundColor);
            if (parsed.messageLine1) setPrimaryMsg(parsed.messageLine1);
            if (parsed.messageLine2) setSecondaryMsg(parsed.messageLine2);
            if (parsed.welcomeMessage) setWelcomeMsg(parsed.welcomeMessage);
          }
        } catch (e) {
          console.error("Fallback load from localStorage failed", e);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- save settings to backend ----------

  async function handleSave() {
    if (!currentUser || currentUser.role !== "admin") return;

    try {
      setSaving(true);
      setError("");

      const seconds = hmsToSeconds(missedTimer);

      const payload = {
        headerColor,
        backgroundColor: bgColor,
        messageLine1: primaryMsg,
        messageLine2: secondaryMsg,
        welcomeMessage: welcomeMsg,
        missedChatThresholdSeconds: seconds,
      };

      await api.put("/api/chatbot/settings", payload);

      // persist to localStorage so MiniChat updates
      saveToLocalStorage({
        headerColor,
        backgroundColor: bgColor,
        messageLine1: primaryMsg,
        messageLine2: secondaryMsg,
        welcomeMessage: welcomeMsg,
      });
    } catch (err) {
      setError(err.message || "Failed to save chatbot settings");
    } finally {
      setSaving(false);
    }
  }

  // ---------- render ----------

  return (
    <div className="cb-page">
      <header className="cb-header">
        <h1 className="cb-title">Chat Bot</h1>
      </header>

      {error && (
        <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
          {error}
        </div>
      )}
      {loading && (
        <div style={{ fontSize: 12, marginBottom: 8 }}>Loading settings…</div>
      )}

      <div className="cb-layout">
        {/* LEFT: live preview – matches MiniChat layout */}
        <section className="cb-preview">
          <div
            className="chat-popup cb-preview-popup"
            style={{ backgroundColor: bgColor }}
          >
            <header
              className="chat-popup-header"
              style={{ backgroundColor: headerColor }}
            >
              <div className="chat-popup-avatar" />
              <div className="chat-popup-title">Hubly</div>
            </header>

            <div
              className="chat-popup-body"
              style={{ backgroundColor: bgColor }}
            >
              <div className="mini-initial-wrapper">
                <div className="mini-agent-row">
                  <div className="mini-agent-avatar" />
                  <div className="mini-agent-bubbles">
                    <div className="mini-agent-bubble">
                      <div className="mini-agent-title">
                        {primaryMsg || "How can I help you?"}
                      </div>
                      {secondaryMsg && (
                        <div className="mini-agent-sub">{secondaryMsg}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="chat-form mini-intro-card">
                  <div className="chat-form-title">Introduction Yourself</div>

                  <label className="chat-form-field">
                    <span>Your name</span>
                    <input value="" placeholder="Your name" readOnly />
                  </label>

                  <label className="chat-form-field">
                    <span>Your Phone</span>
                    <input value="" placeholder="Your Phone" readOnly />
                  </label>

                  <label className="chat-form-field">
                    <span>Your Email</span>
                    <input value="" placeholder="Your Email" readOnly />
                  </label>

                  <button className="chat-submit-btn" type="button">
                    Thank You!
                  </button>
                </div>
              </div>
            </div>

            <footer className="chat-popup-footer">
              <input
                className="chat-footer-input"
                placeholder="Write a message"
                disabled
              />
              <button className="chat-footer-send" type="button" disabled />
            </footer>
          </div>

          {/* tooltip preview – square card like mini tooltip, but static */}
          <div className="cb-tooltip-preview">
            <div className="cb-tooltip-card">
              <div className="cb-tooltip-avatar-dot" />
              <p className="cb-tooltip-text">{welcomeMsg}</p>
            </div>
          </div>
        </section>

        {/* RIGHT: settings cards */}
        <section className="cb-settings">
          {/* Header color */}
          <div className="cb-card">
            <div className="cb-card-title-row">
              <h2 className="cb-card-title">Header Color</h2>
            </div>
            <div className="cb-color-row">
              {headerSwatches.map((c) => (
                <button
                  key={c}
                  className={
                    "cb-color-swatch" + (headerColor === c ? " selected" : "")
                  }
                  style={{ backgroundColor: c }}
                  onClick={() => setHeaderColor(c)}
                  aria-label={`Header color ${c}`}
                  type="button"
                />
              ))}
            </div>
            <div className="cb-color-input">
              <span
                className="cb-color-preview"
                style={{ backgroundColor: headerColor }}
              />
              <span>#</span>
              <input
                value={headerColor.replace("#", "")}
                onChange={handleHeaderColorInput}
              />
            </div>
          </div>

          {/* Background color */}
          <div className="cb-card">
            <div className="cb-card-title-row">
              <h2 className="cb-card-title">Custom Background Color</h2>
            </div>
            <div className="cb-color-row">
              {bgSwatches.map((c) => (
                <button
                  key={c}
                  className={
                    "cb-color-swatch" + (bgColor === c ? " selected" : "")
                  }
                  style={{ backgroundColor: c }}
                  onClick={() => setBgColor(c)}
                  aria-label={`Background color ${c}`}
                  type="button"
                />
              ))}
            </div>
            <div className="cb-color-input">
              <span
                className="cb-color-preview"
                style={{ backgroundColor: bgColor }}
              />
              <span>#</span>
              <input
                value={bgColor.replace("#", "")}
                onChange={handleBgColorInput}
              />
            </div>
          </div>

          {/* Customize message */}
          <div className="cb-card">
            <div className="cb-card-title-row">
              <h2 className="cb-card-title">Customize Message</h2>
            </div>
            <div className="cb-text-row">
              <input
                className="cb-text-input"
                value={primaryMsg}
                onChange={(e) => setPrimaryMsg(e.target.value)}
              />
              <span className="cb-edit-icon" />
            </div>
            <div className="cb-text-row">
              <input
                className="cb-text-input"
                value={secondaryMsg}
                onChange={(e) => setSecondaryMsg(e.target.value)}
              />
              <span className="cb-edit-icon" />
            </div>
          </div>

          {/* Introduction form preview (helper) */}
          <div className="cb-card">
            <div className="cb-card-title-row">
              <h2 className="cb-card-title">Introduction Form</h2>
            </div>
            <div className="cb-intro-preview">
              <div className="cb-form-label">Your name</div>
              <div className="cb-form-line" />
              <div className="cb-form-label">Your Phone</div>
              <div className="cb-form-line" />
              <div className="cb-form-label">Your Email</div>
              <div className="cb-form-line" />
              <button className="cb-form-btn">Thank You!</button>
            </div>
          </div>

          {/* Welcome message */}
          <div className="cb-card">
            <div className="cb-card-title-row">
              <h2 className="cb-card-title">Welcome Message</h2>
              <span className="cb-toggle-label">Yes/No</span>
            </div>
            <div className="cb-welcome-preview">
              <p className="cb-welcome-text">{welcomeMsg}</p>
              <button
                className="cb-edit-icon cb-edit-icon-inline"
                type="button"
              />
            </div>
            <textarea
              className="cb-welcome-input"
              value={welcomeMsg}
              onChange={(e) => setWelcomeMsg(e.target.value)}
            />
          </div>

          {/* Missed chat timer */}
          <div className="cb-card">
            <div className="cb-card-title-row">
              <h2 className="cb-card-title">Missed chat timer</h2>
            </div>
            <div className="cb-timer-grid">
              <div className="cb-timer-col">
                <label>Hours</label>
                <input
                  value={missedTimer.hours}
                  onChange={(e) =>
                    handleTimerChange("hours", e.target.value)
                  }
                />
              </div>
              <div className="cb-timer-col">
                <label>Minutes</label>
                <input
                  value={missedTimer.minutes}
                  onChange={(e) =>
                    handleTimerChange("minutes", e.target.value)
                  }
                />
              </div>
              <div className="cb-timer-col">
                <label>Seconds</label>
                <input
                  value={missedTimer.seconds}
                  onChange={(e) =>
                    handleTimerChange("seconds", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="cb-timer-actions">
              <button
                className="cb-save-btn"
                type="button"
                onClick={handleSave}
                disabled={saving || currentUser?.role !== "admin"}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
