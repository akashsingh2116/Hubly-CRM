import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../apiClient";
import "../styles/auth.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const { firstName, lastName, email, phone, password, confirmPassword } = form;

    if (!firstName.trim() || !lastName.trim()) return setError("First and last name are required.");
    if (!phone.trim())              return setError("Phone number is required.");
    if (password.length < 6)       return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    try {
      setLoading(true);
      const data = await api.post("/api/auth/signup", {
        firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim().toLowerCase(), phone: phone.trim(), password,
      });
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user",  JSON.stringify(data.user));
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create account.");
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

        <h1 className="auth2-heading">Create your account</h1>
        <p className="auth2-sub">
          Already have an account? <Link to="/login">Sign in →</Link>
        </p>

        {error && <div className="auth2-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

        <form className="auth2-form" onSubmit={handleSubmit}>
          <div className="auth2-row">
            <div className="auth2-field">
              <label>First name</label>
              <input className="auth2-input" type="text" name="firstName" placeholder="Jane" required value={form.firstName} onChange={handleChange} autoFocus />
            </div>
            <div className="auth2-field">
              <label>Last name</label>
              <input className="auth2-input" type="text" name="lastName" placeholder="Smith" required value={form.lastName} onChange={handleChange} />
            </div>
          </div>

          <div className="auth2-field">
            <label>Work email</label>
            <input className="auth2-input" type="email" name="email" placeholder="jane@company.com" required value={form.email} onChange={handleChange} />
          </div>

          <div className="auth2-field">
            <label>Phone number</label>
            <input className="auth2-input" type="tel" name="phone" placeholder="+1 (555) 000-0000" required value={form.phone} onChange={handleChange} />
          </div>

          <div className="auth2-row">
            <div className="auth2-field">
              <label>Password</label>
              <input className="auth2-input" type="password" name="password" placeholder="Min. 6 characters" required value={form.password} onChange={handleChange} />
            </div>
            <div className="auth2-field">
              <label>Confirm password</label>
              <input className="auth2-input" type="password" name="confirmPassword" placeholder="Repeat password" required value={form.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          <label className="auth2-checkbox-row">
            <input type="checkbox" defaultChecked />
            <span>
              I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </span>
          </label>

          <button type="submit" className="auth2-submit" disabled={loading}>
            {loading ? "Creating account…" : "Start free trial →"}
          </button>
        </form>

        <p className="auth2-legal">
          No credit card required. Free 14-day trial. Cancel anytime.
        </p>
      </div>

      {/* ── Right: Visual panel ────────────────────────────────────────── */}
      <div className="auth2-visual-panel">
        <div className="auth2-panel-content">
          <div className="auth2-panel-badge">✦ Join 2,000+ businesses</div>

          <h2 className="auth2-panel-title">
            Everything you need to <span>close more deals</span>
          </h2>
          <p className="auth2-panel-sub">
            Set up in minutes. No training required. Your entire team will love it from day one.
          </p>

          {/* Onboarding steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {[
              { num: "1", color: "#3b82f6", title: "Import your data", body: "CSV upload or connect existing tools" },
              { num: "2", color: "#8b5cf6", title: "Set up your pipeline", body: "Customise stages, assign team members" },
              { num: "3", color: "#10b981", title: "Start closing deals", body: "Real-time analytics from your first login" },
            ].map((s) => (
              <div key={s.num} style={{ display: "flex", gap: 14, alignItems: "flex-start",
                padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.07)" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${s.color}25`,
                  border: `2px solid ${s.color}`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 14, fontWeight: 800, color: s.color, flexShrink: 0 }}>
                  {s.num}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="auth2-quote">
            <p className="auth2-quote-text">
              We went from a messy spreadsheet to a full CRM in a single afternoon. The import wizard is brilliant.
            </p>
            <div className="auth2-quote-author">
              <div className="auth2-quote-avatar" style={{ background: "#10b981" }}>JT</div>
              <div>
                <div className="auth2-quote-name">James Torres</div>
                <div className="auth2-quote-role">Founder, ShopDeck</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
