import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../apiClient";
import frame3 from "../assets/frame 3.png";
import logo from "../assets/logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });

      // save token + user for later
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      // go to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <header className="auth-header">
          <img src={logo} alt="Hubly" className="auth-logo" />
        </header>

        <main className="auth-main">
          <div className="auth-form-block">
            <div className="auth-title-row">
              <h1 className="auth-title">Login</h1>
              <Link to="/signup" className="auth-switch-link">
                Don&apos;t have an account?
              </Link>
            </div>

            <form className="auth-form2" onSubmit={handleSubmit}>
              <div className="auth-field2">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field2">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{ color: "red", fontSize: 12 }}>{error}</div>
              )}

              <button
                type="submit"
                className="auth-primary-btn wide"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="auth-bottom-text">
                Don&apos;t have account?{" "}
                <Link to="/signup" className="auth-link">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </main>
      </div>

      <div className="auth-right">
        <img src={frame3} alt="Illustration" className="auth-photo" />
      </div>
    </div>
  );
}
