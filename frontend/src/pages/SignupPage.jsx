// src/pages/SignupPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../apiClient";
import logoImg from "../assets/logo.png";
import authPhoto from "../assets/frame 3.png";

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const { firstName, lastName, email, phone, password, confirmPassword } =
      form;

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // ✅ match backend route: POST /api/auth/signup
      const data = await api.post("/api/auth/signup", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      // same pattern as login
      if (data.token && data.user) {
        localStorage.setItem("hubly_token", data.token);
        localStorage.setItem("hubly_user", JSON.stringify(data.user));
      }

      // redirect after successful signup
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      {/* LEFT: form */}
      <div className="auth-left">
        <header className="auth-header">
          <img src={logoImg} alt="Hubly" className="auth-logo" />
        </header>

        <main className="auth-main">
          <div className="auth-form-block">
            <div className="auth-title-row">
              <h1 className="auth-title">Create an account</h1>
              <Link to="/login" className="auth-switch-link">
                Sign in instead
              </Link>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form2" onSubmit={handleSubmit}>
              <label className="auth-field2">
                <span>First name</span>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                />
              </label>

              <label className="auth-field2">
                <span>Last name</span>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                />
              </label>

              <label className="auth-field2">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </label>

              <label className="auth-field2">
                <span>Phone</span>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                />
              </label>

              <label className="auth-field2">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
              </label>

              <label className="auth-field2">
                <span>Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </label>

              <label className="auth-checkbox-row">
                <input type="checkbox" defaultChecked />
                <span>
                  By creating an account, I agree to our{" "}
                  <span className="auth-legal-link">Terms of use</span> and{" "}
                  <span className="auth-legal-link">Privacy Policy</span>.
                </span>
              </label>

              <button
                type="submit"
                className="auth-primary-btn wide"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create an account"}
              </button>
            </form>

            <p className="auth-legal">
              This site is protected by reCAPTCHA and the{" "}
              <span className="auth-legal-link">Google Privacy Policy</span> and{" "}
              <span className="auth-legal-link">Terms of Service</span> apply.
            </p>
          </div>
        </main>
      </div>

      {/* RIGHT: image */}
      <div className="auth-right">
        <img src={authPhoto} alt="Analytics" className="auth-photo" />
      </div>
    </div>
  );
}
