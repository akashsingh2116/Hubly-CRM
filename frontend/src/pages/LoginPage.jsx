import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../apiClient";
import "../styles/auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user",  JSON.stringify(res.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth2">
      {/* ── Left: Form ────────────────────────────────────────────────── */}
      <div className="auth2-form-panel">
        <Link to="/" className="auth2-logo">
          <div className="auth2-logo-mark">H</div>
          <span className="auth2-logo-name">Hubly</span>
        </Link>

        <h1 className="auth2-heading">Welcome back</h1>
        <p className="auth2-sub">
          Don't have an account?{" "}
          <Link to="/signup">Start your free trial →</Link>
        </p>

        {error && <div className="auth2-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

        <form className="auth2-form" onSubmit={handleSubmit}>
          <div className="auth2-field">
            <label>Email address</label>
            <input
              className="auth2-input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="auth2-field">
            <label>Password</label>
            <input
              className="auth2-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <a href="#" className="auth2-forgot">Forgot password?</a>
          </div>

          <button type="submit" className="auth2-submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in to Hubly →"}
          </button>
        </form>

        <p className="auth2-legal" style={{ marginTop: 24 }}>
          Protected by enterprise-grade security.{" "}
          <a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a>
        </p>
      </div>

      {/* ── Right: Visual panel ────────────────────────────────────────── */}
      <div className="auth2-visual-panel">
        <div className="auth2-panel-content">
          <div className="auth2-panel-badge">✦ Trusted by 2,000+ teams</div>

          <h2 className="auth2-panel-title">
            Your entire customer
            ops in <span>one workspace</span>
          </h2>
          <p className="auth2-panel-sub">
            Contacts, deals, support tickets, and analytics — all beautifully connected.
          </p>

          {/* Stats */}
          <div className="auth2-stats" style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 28 }}>
            <div className="auth2-stat">
              <div className="auth2-stat-number">98%</div>
              <div className="auth2-stat-label">CSAT score</div>
            </div>
            <div className="auth2-stat">
              <div className="auth2-stat-number">3 min</div>
              <div className="auth2-stat-label">Avg response</div>
            </div>
            <div className="auth2-stat">
              <div className="auth2-stat-number">4.2M</div>
              <div className="auth2-stat-label">Tickets resolved</div>
            </div>
          </div>

          <div className="auth2-features">
            <div className="auth2-feat">
              <div className="auth2-feat-icon auth2-feat-icon--blue">💬</div>
              <div>
                <div className="auth2-feat-title">Omnichannel Inbox</div>
                <div className="auth2-feat-body">Email, live chat, social — one unified view</div>
              </div>
            </div>
            <div className="auth2-feat">
              <div className="auth2-feat-icon auth2-feat-icon--purple">🚀</div>
              <div>
                <div className="auth2-feat-title">Deal Pipeline</div>
                <div className="auth2-feat-body">Drag-and-drop Kanban with revenue forecasting</div>
              </div>
            </div>
            <div className="auth2-feat">
              <div className="auth2-feat-icon auth2-feat-icon--green">⚡</div>
              <div>
                <div className="auth2-feat-title">Smart Automation</div>
                <div className="auth2-feat-body">Chatbots, SLA rules, and auto-assignment</div>
              </div>
            </div>
          </div>

          <div className="auth2-quote">
            <p className="auth2-quote-text">
              Hubly replaced three tools for us. The pipeline view alone saved our reps 2 hours a day.
            </p>
            <div className="auth2-quote-author">
              <div className="auth2-quote-avatar">AK</div>
              <div>
                <div className="auth2-quote-name">Alex Kim</div>
                <div className="auth2-quote-role">VP of Sales, NovaPay</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
