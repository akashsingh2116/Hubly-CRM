// src/pages/Analytics.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../apiClient";

export default function Analytics() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await api.get("/api/analytics/overview");
        setStats(data);
      } catch (err) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const avgReply = stats?.averageReplyTimeSeconds ?? 0;
  const totalChats = stats?.totalChats ?? 0;
  const resolvedPct = stats?.resolvedRatePercent ?? 0;

  // donut math for the existing SVG (r=30)
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const resolvedOffset =
    circumference - (Math.min(Math.max(resolvedPct, 0), 100) / 100) * circumference;

  const missedWeek6 =
    stats?.missedByWeek && stats.missedByWeek.length >= 6
      ? stats.missedByWeek[5].value
      : 13; // fallback to design value

  return (
    <div className="analytics-page">
      {/* Page title */}
      <header className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
      </header>

      {/* small error / loading text without changing layout */}
      {error && (
        <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>{error}</div>
      )}
      {loading && (
        <div style={{ fontSize: 12, marginBottom: 8 }}>Loading analytics…</div>
      )}

      {/* Missed Chats chart */}
      <section className="analytics-card analytics-missed-card">
        <div className="analytics-card-header">
          <h2 className="analytics-card-title">Missed Chats</h2>
          <button className="analytics-menu-btn" aria-label="More options">
            ···
          </button>
        </div>

        <div className="analytics-chart-wrapper">
          {/* Simple SVG line chart (still static layout, data can be refined later) */}
          <svg
            className="analytics-line-chart"
            viewBox="0 0 400 180"
            preserveAspectRatio="none"
          >
            {/* horizontal grid lines */}
            <g className="analytics-grid">
              <line x1="0" y1="30" x2="400" y2="30" />
              <line x1="0" y1="70" x2="400" y2="70" />
              <line x1="0" y1="110" x2="400" y2="110" />
              <line x1="0" y1="150" x2="400" y2="150" />
            </g>

            {/* line */}
            <polyline
              className="analytics-line"
              points="
                0,70
                44,105
                88,60
                132,95
                176,80
                220,120
                264,95
                308,80
                352,55
                400,35
              "
            />

            {/* points */}
            <g className="analytics-points">
              <circle cx="0" cy="70" r="4" />
              <circle cx="44" cy="105" r="4" />
              <circle cx="88" cy="60" r="4" />
              <circle cx="132" cy="95" r="4" />
              <circle cx="176" cy="80" r="4" />
              <circle cx="220" cy="120" r="4" />
              <circle cx="264" cy="95" r="4" />
              <circle cx="308" cy="80" r="4" />
              <circle cx="352" cy="55" r="4" />
              <circle cx="400" cy="35" r="4" />
            </g>

            {/* highlighted point + dashed line (Week 6) */}
            <g className="analytics-highlight">
              <line
                x1="220"
                y1="120"
                x2="220"
                y2="170"
                className="analytics-dashed"
              />
              <circle
                cx="220"
                cy="120"
                r="5"
                className="analytics-highlight-point"
              />
            </g>
          </svg>

          {/* tooltip card over the highlighted point */}
          <div className="analytics-tooltip">
            <span className="analytics-tooltip-label">Chats</span>
            <span className="analytics-tooltip-value">{missedWeek6}</span>
          </div>

          {/* x-axis labels */}
          <div className="analytics-x-axis">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
            <span>Week 5</span>
            <span>Week 6</span>
            <span>Week 7</span>
            <span>Week 8</span>
            <span>Week 9</span>
            <span>Week 10</span>
          </div>
        </div>
      </section>

      {/* Metrics: Average Reply Time, Resolved Tickets, Total Chats */}
      <section className="analytics-metrics">
        {/* Average reply time */}
        <div className="analytics-metric-row">
          <div className="analytics-metric-text">
            <h3 className="analytics-metric-title">Average Reply time</h3>
            <p className="analytics-metric-desc">
              For highest customer satisfaction rates you should aim to reply to an
              incoming customer&apos;s message in 15 seconds or less. Quick responses
              will get you more conversations, help you earn customers trust and make
              more sales.
            </p>
          </div>
          <div className="analytics-metric-value analytics-metric-value--big">
            {avgReply} secs
          </div>
        </div>

        {/* Resolved tickets with donut */}
        <div className="analytics-metric-row">
          <div className="analytics-metric-text">
            <h3 className="analytics-metric-title">Resolved Tickets</h3>
            <p className="analytics-metric-desc">
              A callback system on a website, as well as proactive invitations, help
              to attract even more customers. A separate round button for ordering a
              call with a small animation helps to motivate more customers to make
              calls.
            </p>
          </div>

          <div className="analytics-donut-wrapper">
            <svg
              className="analytics-donut"
              viewBox="0 0 80 80"
              aria-label={`${resolvedPct}% resolved`}
            >
              <circle className="analytics-donut-track" cx="40" cy="40" r="30" />
              <circle
                className="analytics-donut-value"
                cx="40"
                cy="40"
                r="30"
                strokeDasharray={circumference.toFixed(1)}
                strokeDashoffset={resolvedOffset}
              />
              <text
                x="40"
                y="44"
                textAnchor="middle"
                className="analytics-donut-text"
              >
                {resolvedPct}%
              </text>
            </svg>
          </div>
        </div>

        {/* Total chats */}
        <div className="analytics-metric-row">
          <div className="analytics-metric-text">
            <h3 className="analytics-metric-title">Total Chats</h3>
            <p className="analytics-metric-desc">
              This metric shows the total number of chats for all channels for the
              selected period.
            </p>
          </div>
          <div className="analytics-metric-value analytics-metric-value--big">
            {totalChats} Chats
          </div>
        </div>
      </section>
    </div>
  );
}
