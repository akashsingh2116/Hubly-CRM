// src/pages/Setting.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../apiClient";

export default function Setting() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [original, setOriginal] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // redirect to login if not logged in
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  // load current user profile from backend
  useEffect(() => {
    async function loadMe() {
      try {
        setLoading(true);
        setError("");
        const me = await api.get("/api/users/me");

        setForm((f) => ({
          ...f,
          firstName: me.firstName || "",
          lastName: me.lastName || "",
          email: me.email || "",
          password: "",
          confirmPassword: "",
        }));

        setOriginal({
          firstName: me.firstName || "",
          lastName: me.lastName || "",
          email: me.email || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, []);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSuccess("");
    setError("");
  }

  const passwordChanged =
    form.password.trim().length > 0 ||
    form.confirmPassword.trim().length > 0;

  // any simple change?
  const hasProfileChange =
    form.firstName !== original.firstName ||
    form.lastName !== original.lastName;

  const passwordsMatch =
    form.password === form.confirmPassword || !passwordChanged;

  const canSave =
    !loading && !saving && passwordsMatch && (hasProfileChange || passwordChanged);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const body = {};
      if (form.firstName !== original.firstName) {
        body.firstName = form.firstName;
      }
      if (form.lastName !== original.lastName) {
        body.lastName = form.lastName;
      }
      if (passwordChanged) {
        if (form.password !== form.confirmPassword) {
          setError("Passwords do not match");
          setSaving(false);
          return;
        }
        body.password = form.password;
      }

      const res = await api.patch("/api/users/me", body);

      // update localStorage user (non-sensitive fields)
      const storedRaw = localStorage.getItem("user");
      if (storedRaw) {
        try {
          const stored = JSON.parse(storedRaw);
          const updated = {
            ...stored,
            firstName: res.user.firstName,
            lastName: res.user.lastName,
            phone: res.user.phone,
          };
          localStorage.setItem("user", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      if (res.passwordChanged) {
        // SRD rule: force logout immediately when password changes
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setOriginal({
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        email: res.user.email,
      });

      setForm((f) => ({
        ...f,
        password: "",
        confirmPassword: "",
      }));

      setSuccess("Profile updated");
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sp-page">
      <header className="sp-header">
        <h1 className="sp-title">Settings</h1>
      </header>

      <section className="sp-card">
        <div className="sp-tabs">
          <button className="sp-tab active">Edit Profile</button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <form className="sp-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ color: "green", fontSize: 12, marginBottom: 8 }}>
                {success}
              </div>
            )}

            {/* First name */}
            <div className="sp-field">
              <label>First name</label>
              <input
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
            </div>

            {/* Last name */}
            <div className="sp-field">
              <label>Last name</label>
              <input
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </div>

            {/* Email (not editable) */}
            <div className="sp-field sp-field-with-info">
              <label>Email</label>
              <div className="sp-input-with-icon">
                <input value={form.email} disabled />
                <span className="sp-info-icon" aria-hidden="true" />
              </div>
            </div>

            {/* Password */}
            <div className="sp-field sp-field-with-info">
              <label>Password</label>
              <div className="sp-input-with-icon">
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="New password (optional)"
                />
                <span className="sp-info-icon" aria-hidden="true" />
              </div>
            </div>

            {/* Confirm password + tooltip */}
            <div className="sp-field sp-field-with-info sp-field-password-confirm">
              <label>Confirm Password</label>
              <div className="sp-input-with-icon">
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm password"
                />
                <span className="sp-info-icon" aria-hidden="true" />
              </div>

             
            </div>

            <div className="sp-actions">
              <button type="submit" className="sp-save-btn" disabled={!canSave}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
