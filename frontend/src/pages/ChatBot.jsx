import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../apiClient";
import "../styles/pages.css";

export default function ChatBot() {
  const navigate    = useNavigate();
  const currentUser = getCurrentUser();
  const isAdmin     = currentUser?.role === "admin";

  const [headerColor,  setHeaderColor]  = useState("#1f3c5c");
  const [bgColor,      setBgColor]      = useState("#f3f4f7");
  const [primaryMsg,   setPrimaryMsg]   = useState("How can I help you?");
  const [secondaryMsg, setSecondaryMsg] = useState("Ask me anything!");
  const [welcomeMsg,   setWelcomeMsg]   = useState(
    "Want to chat about Hubly? I'm a chatbot here to help you find your way."
  );
  const [missedTimer, setMissedTimer] = useState({ hours: "00", minutes: "10", seconds: "00" });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const HEADER_SWATCHES = ["#1f3c5c","#3b82f6","#6366f1","#10b981","#0f172a","#ffffff"];
  const BG_SWATCHES     = ["#f3f4f7","#ffffff","#0f172a","#f8fafc","#e2e8f0"];

  function secondsToHMS(s) {
    s = Math.max(0, s || 0);
    return { hours: String(Math.floor(s/3600)).padStart(2,"0"), minutes: String(Math.floor((s%3600)/60)).padStart(2,"0"), seconds: String(s%60).padStart(2,"0") };
  }
  function hmsToSeconds({ hours, minutes, seconds }) {
    return (parseInt(hours||"0")||0)*3600 + (parseInt(minutes||"0")||0)*60 + (parseInt(seconds||"0")||0);
  }
  function saveLocal(s) {
    try { localStorage.setItem("hubly_chatbot_settings", JSON.stringify(s)); } catch {}
  }

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    (async () => {
      try {
        setLoading(true); setError("");
        const d = await api.get("/api/chatbot/settings");
        const h = d.headerColor || "#1f3c5c", b = d.backgroundColor || "#f3f4f7";
        const m1 = d.messageLine1 || "How can I help you?", m2 = d.messageLine2 || "Ask me anything!";
        const wm = d.welcomeMessage || welcomeMsg;
        const hms = secondsToHMS(d.missedChatThresholdSeconds || 600);
        setHeaderColor(h); setBgColor(b); setPrimaryMsg(m1); setSecondaryMsg(m2); setWelcomeMsg(wm); setMissedTimer(hms);
        saveLocal({ headerColor: h, backgroundColor: b, messageLine1: m1, messageLine2: m2, welcomeMessage: wm });
      } catch (err) {
        setError(err.message || "Failed to load settings");
        try { const raw = localStorage.getItem("hubly_chatbot_settings"); if (raw) { const p = JSON.parse(raw); if (p.headerColor) setHeaderColor(p.headerColor); if (p.backgroundColor) setBgColor(p.backgroundColor); if (p.messageLine1) setPrimaryMsg(p.messageLine1); if (p.messageLine2) setSecondaryMsg(p.messageLine2); if (p.welcomeMessage) setWelcomeMsg(p.welcomeMessage); } } catch {}
      } finally { setLoading(false); }
    })();
  }, []);

  async function handleSave() {
    if (!isAdmin) return;
    try {
      setSaving(true); setError(""); setSuccess("");
      const payload = { headerColor, backgroundColor: bgColor, messageLine1: primaryMsg, messageLine2: secondaryMsg, welcomeMessage: welcomeMsg, missedChatThresholdSeconds: hmsToSeconds(missedTimer) };
      await api.put("/api/chatbot/settings", payload);
      saveLocal({ headerColor, backgroundColor: bgColor, messageLine1: primaryMsg, messageLine2: secondaryMsg, welcomeMessage: welcomeMsg });
      setSuccess("Settings saved successfully.");
    } catch (err) { setError(err.message || "Failed to save settings"); }
    finally { setSaving(false); }
  }

  return (
    <div className="pg">
      <div className="pg-header">
        <div className="pg-header__left">
          <h1 className="pg-title">Chat Widget</h1>
          <p className="pg-subtitle">Customise the appearance and messages of your live chat widget</p>
        </div>
        {isAdmin && (
          <div className="pg-header__right">
            <button className="btn2 btn2--primary" onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      {error   && <div className="pg-alert pg-alert--error" style={{ marginBottom: 16 }}>⚠ {error}</div>}
      {success && <div className="pg-alert pg-alert--success" style={{ marginBottom: 16 }}>✓ {success}</div>}

      {loading ? (
        <div className="pg-loading"><div className="pg-spinner" /> Loading…</div>
      ) : (
        <div className="cb2-layout">
          {/* ── Preview ──────────────────────────────────────────────────── */}
          <div className="cb2-preview-wrap">
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--p-muted)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Live Preview</div>
            <div className="cb2-browser">
              <div className="cb2-browser-bar">
                <div className="cb2-browser-dot cb2-browser-dot--r" />
                <div className="cb2-browser-dot cb2-browser-dot--y" />
                <div className="cb2-browser-dot cb2-browser-dot--g" />
              </div>
              <div style={{ background: bgColor, padding: 16 }}>
                {/* Widget preview */}
                <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.2)", maxWidth: 280, marginLeft: "auto" }}>
                  {/* Header */}
                  <div style={{ background: headerColor, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Hubly</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>● Online</div>
                    </div>
                  </div>
                  {/* Body */}
                  <div style={{ background: bgColor, padding: 14 }}>
                    <div style={{ background: headerColor, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 2 }}>{primaryMsg || "How can I help you?"}</div>
                      {secondaryMsg && <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)" }}>{secondaryMsg}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Introduce yourself</div>
                    {["Your name", "Your Phone", "Your Email"].map((ph) => (
                      <div key={ph} style={{ background: "rgba(0,0,0,.05)", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{ph}</div>
                    ))}
                    <div style={{ background: headerColor, color: "#fff", borderRadius: 8, padding: "8px 12px", textAlign: "center", fontSize: 12, fontWeight: 600 }}>Start chat →</div>
                  </div>
                  {/* Footer */}
                  <div style={{ background: "#fff", padding: "10px 12px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#94a3b8" }}>Write a message…</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: headerColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>→</div>
                  </div>
                </div>

                {/* Welcome tooltip */}
                <div style={{ marginTop: 12, marginLeft: "auto", maxWidth: 240, background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 4px 16px rgba(0,0,0,.1)", border: "1px solid #e2e8f0", fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
                  💬 {welcomeMsg}
                </div>
              </div>
            </div>
          </div>

          {/* ── Settings cards ────────────────────────────────────────────── */}
          <div className="cb2-cards">

            {/* Header Color */}
            <div className="cb2-card">
              <div className="cb2-card__title">Header Color</div>
              <div className="cb2-swatches">
                {HEADER_SWATCHES.map((c) => (
                  <button key={c} type="button" className={`cb2-swatch${headerColor === c ? " selected" : ""}`}
                    style={{ background: c, border: headerColor === c ? "2px solid #3b82f6" : "2px solid var(--p-border)" }}
                    onClick={() => setHeaderColor(c)} />
                ))}
              </div>
              <div className="cb2-swatch-custom">
                <div className="cb2-swatch-preview" style={{ background: headerColor }} />
                <span style={{ color: "var(--p-muted)", fontSize: 13 }}>#</span>
                <input className="cb2-swatch-input" value={headerColor.replace("#", "")}
                  onChange={(e) => { const v = e.target.value.replace(/[^0-9a-fA-F]/g,"").slice(0,6); setHeaderColor("#"+v); }} />
              </div>
            </div>

            {/* Background Color */}
            <div className="cb2-card">
              <div className="cb2-card__title">Widget Background Color</div>
              <div className="cb2-swatches">
                {BG_SWATCHES.map((c) => (
                  <button key={c} type="button" className={`cb2-swatch${bgColor === c ? " selected" : ""}`}
                    style={{ background: c, border: bgColor === c ? "2px solid #3b82f6" : "2px solid var(--p-border)" }}
                    onClick={() => setBgColor(c)} />
                ))}
              </div>
              <div className="cb2-swatch-custom">
                <div className="cb2-swatch-preview" style={{ background: bgColor }} />
                <span style={{ color: "var(--p-muted)", fontSize: 13 }}>#</span>
                <input className="cb2-swatch-input" value={bgColor.replace("#", "")}
                  onChange={(e) => { const v = e.target.value.replace(/[^0-9a-fA-F]/g,"").slice(0,6); setBgColor("#"+v); }} />
              </div>
            </div>

            {/* Messages */}
            <div className="cb2-card">
              <div className="cb2-card__title">Chat Greeting Messages</div>
              <div className="pg-field" style={{ marginBottom: 10 }}>
                <label>Primary message</label>
                <input className="cb2-text-input" value={primaryMsg} onChange={(e) => setPrimaryMsg(e.target.value)} placeholder="How can I help you?" />
              </div>
              <div className="pg-field">
                <label>Secondary message</label>
                <input className="cb2-text-input" value={secondaryMsg} onChange={(e) => setSecondaryMsg(e.target.value)} placeholder="Ask me anything!" />
              </div>
            </div>

            {/* Welcome message */}
            <div className="cb2-card">
              <div className="cb2-card__title">Welcome Tooltip Message</div>
              <textarea className="cb2-textarea" value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} rows={3} />
              <p style={{ fontSize: 12, color: "var(--p-muted)", marginTop: 6 }}>This appears in the chat bubble tooltip before a visitor opens the widget.</p>
            </div>

            {/* Missed chat timer */}
            <div className="cb2-card">
              <div className="cb2-card__title">Missed Chat Auto-close Timer</div>
              <p style={{ fontSize: 13, color: "var(--p-muted)", marginBottom: 14 }}>Automatically close a chat if no agent responds within this time.</p>
              <div className="cb2-timer-row">
                {["hours","minutes","seconds"].map((k) => (
                  <div className="cb2-timer-col" key={k}>
                    <label>{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                    <input className="cb2-timer-input"
                      value={missedTimer[k]}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g,"").slice(0,2);
                        setMissedTimer(p => ({ ...p, [k]: v }));
                      }} />
                  </div>
                ))}
              </div>
            </div>

            {!isAdmin && (
              <div className="pg-alert pg-alert--warning">
                ⚠ Only admins can save chatbot settings.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
