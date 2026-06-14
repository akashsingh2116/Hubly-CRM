import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../apiClient";
import "../styles/pages.css";

const TABS = [
  { key: "profile",    icon: "👤", label: "Profile" },
  { key: "security",   icon: "🔒", label: "Security" },
  { key: "appearance", icon: "🎨", label: "Appearance" },
  { key: "notifications", icon: "🔔", label: "Notifications" },
];

function avatarColor(name = "") {
  const colors = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}
function initials(first = "", last = "") {
  return (first[0] ?? "") + (last[0] ?? "");
}

export default function Setting() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  const [form, setForm]     = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [pwForm, setPwForm] = useState({ password: "", confirmPassword: "" });
  const [original, setOriginal] = useState({ firstName: "", lastName: "", email: "" });

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark"
  );

  const [notifPrefs, setNotifPrefs] = useState({
    newTicket:  true,
    assignment: true,
    mention:    true,
    digest:     false,
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { navigate("/login"); return; }

    (async () => {
      try {
        setLoading(true);
        const me = await api.get("/api/users/me");
        const data = { firstName: me.firstName || "", lastName: me.lastName || "", email: me.email || "", phone: me.phone || "" };
        setForm(data);
        setOriginal(data);
      } catch (err) { setError(err.message || "Failed to load profile"); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSuccess(""); setError("");
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    if (form.firstName === original.firstName && form.lastName === original.lastName && form.phone === original.phone) {
      setError("No changes to save."); return;
    }
    try {
      setSaving(true); setError(""); setSuccess("");
      const res = await api.patch("/api/users/me", {
        firstName: form.firstName, lastName: form.lastName, phone: form.phone,
      });
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          localStorage.setItem("user", JSON.stringify({ ...u, firstName: res.user.firstName, lastName: res.user.lastName }));
        } catch {}
      }
      setOriginal({ firstName: res.user.firstName, lastName: res.user.lastName, email: res.user.email });
      setSuccess("Profile updated successfully.");
    } catch (err) { setError(err.message || "Failed to save."); }
    finally { setSaving(false); }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (!pwForm.password) { setError("Enter a new password."); return; }
    if (pwForm.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (pwForm.password !== pwForm.confirmPassword) { setError("Passwords do not match."); return; }
    try {
      setSaving(true); setError(""); setSuccess("");
      await api.patch("/api/users/me", { password: pwForm.password });
      localStorage.removeItem("token"); localStorage.removeItem("user");
      navigate("/login");
    } catch (err) { setError(err.message || "Failed to update password."); }
    finally { setSaving(false); }
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("hubly_theme", next ? "dark" : "light");
  }

  if (loading) return <div className="pg"><div className="pg-loading"><div className="pg-spinner" /> Loading…</div></div>;

  const initStr = initials(form.firstName, form.lastName).toUpperCase() || "U";
  const fullName = `${form.firstName} ${form.lastName}`.trim() || "User";

  return (
    <div className="pg">
      <div className="pg-header">
        <div className="pg-header__left">
          <h1 className="pg-title">Settings</h1>
          <p className="pg-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar nav */}
        <div>
          <div className="pg-card" style={{ padding: "8px" }}>
            {/* User summary */}
            <div style={{ padding: "12px 8px 16px", borderBottom: `1px solid var(--p-border)`, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="settings-avatar-big" style={{ background: avatarColor(fullName) }}>
                  {initStr}
                </div>
                <div>
                  <div className="settings-avatar-name">{fullName}</div>
                  <div className="settings-avatar-role">{form.email}</div>
                </div>
              </div>
            </div>
            <nav className="settings-nav">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`settings-nav-item${activeTab === t.key ? " active" : ""}`}
                  onClick={() => { setActiveTab(t.key); setError(""); setSuccess(""); }}
                >
                  <span className="settings-nav-icon">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error   && <div className="pg-alert pg-alert--error">⚠ {error}</div>}
          {success && <div className="pg-alert pg-alert--success">✓ {success}</div>}

          {/* ── Profile tab ─────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="pg-card">
              <div className="pg-card__header"><h3 className="pg-card__title">Personal Information</h3></div>
              <div className="pg-card__body">
                <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="pg-field-row">
                    <div className="pg-field">
                      <label>First name</label>
                      <input className="pg-input" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} required />
                    </div>
                    <div className="pg-field">
                      <label>Last name</label>
                      <input className="pg-input" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} required />
                    </div>
                  </div>
                  <div className="pg-field">
                    <label>Email address <span style={{ color: "var(--p-muted)", fontWeight: 400 }}>(read-only)</span></label>
                    <input className="pg-input" value={form.email} disabled />
                  </div>
                  <div className="pg-field">
                    <label>Phone number</label>
                    <input className="pg-input" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn2 btn2--primary" disabled={saving}>
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Security tab ─────────────────────────────────────────────── */}
          {activeTab === "security" && (
            <div className="pg-card">
              <div className="pg-card__header"><h3 className="pg-card__title">Change Password</h3></div>
              <div className="pg-card__body">
                <div className="pg-alert pg-alert--warning" style={{ marginBottom: 16 }}>
                  ⚠ Changing your password will log you out immediately.
                </div>
                <form onSubmit={handlePasswordSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="pg-field">
                    <label>New password</label>
                    <input className="pg-input" type="password" placeholder="Min. 6 characters" value={pwForm.password} onChange={(e) => setPwForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div className="pg-field">
                    <label>Confirm new password</label>
                    <input className="pg-input" type="password" placeholder="Repeat password" value={pwForm.confirmPassword} onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn2 btn2--danger" disabled={saving}>
                      {saving ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Appearance tab ──────────────────────────────────────────── */}
          {activeTab === "appearance" && (
            <div className="pg-card">
              <div className="pg-card__header"><h3 className="pg-card__title">Appearance</h3></div>
              <div className="pg-card__body">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--p-border)" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--p-text)", marginBottom: 4 }}>Dark mode</div>
                    <div style={{ fontSize: 13, color: "var(--p-muted)" }}>Switch between light and dark interface</div>
                  </div>
                  <button
                    onClick={toggleDark}
                    style={{
                      width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                      background: darkMode ? "#3b82f6" : "var(--p-border)",
                      position: "relative", transition: "background .2s",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 3, left: darkMode ? 25 : 3,
                      width: 20, height: 20, borderRadius: "50%", background: "#fff",
                      transition: "left .2s", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                    }} />
                  </button>
                </div>
                <div style={{ paddingTop: 16 }}>
                  <div style={{ fontSize: 13, color: "var(--p-muted)" }}>
                    Current theme: <strong style={{ color: "var(--p-text)" }}>{darkMode ? "Dark" : "Light"}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications tab ────────────────────────────────────────── */}
          {activeTab === "notifications" && (
            <div className="pg-card">
              <div className="pg-card__header"><h3 className="pg-card__title">Notification Preferences</h3></div>
              <div className="pg-card__body">
                {[
                  { key: "newTicket",  label: "New ticket created",    sub: "Get notified when a new customer ticket arrives" },
                  { key: "assignment", label: "Ticket assigned to you", sub: "When a ticket is assigned to your account" },
                  { key: "mention",    label: "Mentions",              sub: "When someone mentions you in a ticket reply" },
                  { key: "digest",     label: "Weekly digest",         sub: "Summary of team activity sent every Monday" },
                ].map((n) => (
                  <div key={n.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--p-border)" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--p-text)", marginBottom: 2 }}>{n.label}</div>
                      <div style={{ fontSize: 13, color: "var(--p-muted)" }}>{n.sub}</div>
                    </div>
                    <button
                      onClick={() => setNotifPrefs(p => ({ ...p, [n.key]: !p[n.key] }))}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                        background: notifPrefs[n.key] ? "#3b82f6" : "var(--p-border)",
                        position: "relative", transition: "background .2s", flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 3, left: notifPrefs[n.key] ? 22 : 2,
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        transition: "left .2s", display: "block",
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
