import React, { useEffect, useState } from "react";
import { api } from "../apiClient";
import { useToast } from "../context/ToastContext";

function BarChart({ data, color = "#3b82f6", label = "" }) {
  if (!data?.length) return <div style={{ textAlign:"center", padding: 24, color: "var(--p-muted)", fontSize: 13 }}>No data</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-text)", marginBottom: 16 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 10, color: "var(--p-muted)", fontWeight: 600 }}>{d.value || ""}</div>
            <div style={{
              width: "100%", background: `${color}30`, borderRadius: "6px 6px 0 0",
              height: `${(d.value / max) * 90}px`, minHeight: d.value ? 4 : 0,
              transition: "height .4s", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", bottom: 0, width: "100%", height: "40%", background: color, borderRadius: "6px 6px 0 0" }} />
            </div>
            <div style={{ fontSize: 10, color: "var(--p-muted)", whiteSpace: "nowrap" }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ pct, color = "#3b82f6", label = "" }) {
  const r = 38; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-text)", marginBottom: 12 }}>{label}</div>}
      <svg viewBox="0 0 100 100" width="120" height="120">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--p-border)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset .6s" }}
        />
        <text x="50" y="52" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--p-text)">{pct}%</text>
        <text x="50" y="65" textAnchor="middle" fontSize="9" fill="var(--p-muted)">resolved</text>
      </svg>
    </div>
  );
}

function avatarColor(name = "") {
  const c = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444"];
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return c[h % c.length];
}
function fmtSec(s) {
  if (!s) return "—"; if (s < 60) return `${s}s`; return `${Math.round(s / 60)}m`;
}
function fmtUSD(v) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);
}

const STAGE_COLORS = {
  lead: "#94a3b8", qualified: "#60a5fa", proposal: "#a78bfa",
  negotiation: "#fb923c", closed_won: "#4ade80", closed_lost: "#f87171",
};

export default function Analytics() {
  const toast = useToast();
  const [overview,   setOverview]   = useState(null);
  const [agents,     setAgents]     = useState([]);
  const [pipeline,   setPipeline]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [tab,        setTab]        = useState("overview");
  const [dateRange,  setDateRange]  = useState({ from: "", to: "" });

  async function load() {
    setLoading(true);
    setTabLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to)   params.set("to",   dateRange.to);
      const qs = params.toString() ? `?${params}` : "";
      const [ov, ag, pip] = await Promise.all([
        api.get(`/api/analytics/overview${qs}`),
        api.get(`/api/analytics/agents${qs}`),
        api.get("/api/analytics/pipeline"),
      ]);
      setOverview(ov); setAgents(ag || []); setPipeline(pip);
    } catch {} finally { setLoading(false); setTabLoading(false); }
  }

  function handleTabChange(t) {
    setTabLoading(true);
    setTab(t);
    setTimeout(() => setTabLoading(false), 0);
  }

  useEffect(() => { load(); }, [dateRange]);

  function exportCsv() {
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to)   params.set("to",   dateRange.to);
      const a = document.createElement("a");
      a.href = `http://localhost:5000/api/analytics/export${params.toString() ? "?" + params : ""}`;
      a.download = "hubly-analytics.csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success("Report exported");
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="pg">
      <div className="pg-header">
        <div className="pg-header__left">
          <h1 className="pg-title">Analytics</h1>
          <p className="pg-subtitle">Track performance, agent stats, and deal pipeline</p>
        </div>
        <div className="pg-header__right">
          <input type="date" className="pg-select" style={{ width: 140 }} value={dateRange.from} onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))} />
          <span style={{ color: "var(--p-muted)", fontSize: 13 }}>to</span>
          <input type="date" className="pg-select" style={{ width: 140 }} value={dateRange.to} onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))} />
          <button className="btn2 btn2--ghost" onClick={exportCsv}>⬇ Export CSV</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="pg-tabs">
          {["overview","agents","pipeline"].map((t) => (
            <button key={t} className={`pg-tab${tab === t ? " active" : ""}`} onClick={() => handleTabChange(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <>
          {/* Skeleton stat cards while loading */}
          {loading || tabLoading ? (
            <>
              <div className="pg-stats">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="pg-stat">
                    <div className="sk-rect sk-shimmer" style={{ height: 14, width: "60%", marginBottom: 12 }} />
                    <div className="sk-rect sk-shimmer" style={{ height: 32, width: "40%" }} />
                  </div>
                ))}
              </div>
              <div className="sk-rect sk-shimmer" style={{ height: 200, width: "100%", borderRadius: 12, marginTop: 16 }} />
            </>
          ) : !overview || overview.totalChats === 0 ? (
            <div className="pg-empty">
              <div className="pg-empty__icon">📊</div>
              <div className="pg-empty__title">No data for this period</div>
              <div className="pg-empty__sub">Adjust the date range or wait for customer activity</div>
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="pg-stats" style={{ marginBottom: 20 }}>
                {[
                  { label: "Total Tickets",   value: overview?.totalChats      ?? 0, icon: "🎫", color: "--blue" },
                  { label: "Resolved",        value: overview?.resolvedCount    ?? 0, icon: "✅", color: "--green", sub: `${overview?.resolvedRatePercent ?? 0}% rate` },
                  { label: "Avg First Reply", value: fmtSec(overview?.averageReplyTimeSeconds), icon: "⚡", color: "--orange" },
                  { label: "SLA Breached",    value: overview?.slaBreached      ?? 0, icon: "⚠️", color: "--red" },
                ].map((s) => (
                  <div className="pg-stat" key={s.label}>
                    <div className="pg-stat__top">
                      <span className="pg-stat__label">{s.label}</span>
                      <div className={`pg-stat__icon pg-stat__icon${s.color}`}>{s.icon}</div>
                    </div>
                    <div className="pg-stat__value">{s.value}</div>
                    {s.sub && <div className="pg-stat__change pg-stat__change--up">{s.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                <div className="pg-card">
                  <div className="pg-card__body">
                    <BarChart data={overview?.missedByWeek} color="#ef4444" label="Missed Chats by Week" />
                  </div>
                </div>
                <div className="pg-card">
                  <div className="pg-card__body" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 160 }}>
                    <DonutChart pct={overview?.resolvedRatePercent ?? 0} color="#10b981" label="Resolution Rate" />
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      ) : tab === "agents" ? (
        <div className="pg-card">
          {loading || tabLoading ? (
            <div className="pg-loading"><div className="pg-spinner" /></div>
          ) : agents.length === 0 ? (
            <div className="pg-empty">
              <div className="pg-empty__icon">👥</div>
              <div className="pg-empty__title">No agent data</div>
              <div className="pg-empty__sub">Agent performance appears here once tickets are assigned</div>
            </div>
          ) : (
            <div className="pg-table-wrap">
              <table className="pg-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Role</th>
                    <th>Tickets</th>
                    <th>Resolved</th>
                    <th>Resolution %</th>
                    <th>Avg First Reply</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => {
                    const resRate = a.totalTickets ? Math.round((a.resolvedTickets / a.totalTickets) * 100) : 0;
                    const parts = a.name?.split(" ") ?? [];
                    const initials = (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
                    return (
                      <tr key={a.agentId}>
                        <td>
                          <div className="pg-name-cell">
                            <div className="pg-avatar pg-avatar--sm" style={{ background: avatarColor(a.name) }}>
                              {initials}
                            </div>
                            <span className="pg-name-cell__name">{a.name}</span>
                          </div>
                        </td>
                        <td><span className={`team-role-badge team-role-badge--${a.role === "admin" ? "admin" : "member"}`}>{a.role}</span></td>
                        <td style={{ fontWeight: 600 }}>{a.totalTickets}</td>
                        <td>{a.resolvedTickets}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--p-border)", overflow: "hidden" }}>
                              <div style={{ width: `${resRate}%`, height: "100%", background: "#10b981", borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12, color: "var(--p-text)", fontWeight: 600, width: 32 }}>{resRate}%</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: "var(--p-muted)" }}>{a.averageFirstReplyMs != null ? fmtSec(Math.round(a.averageFirstReplyMs / 1000)) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          {loading || tabLoading ? (
            <div className="pg-loading"><div className="pg-spinner" /></div>
          ) : !pipeline || (!pipeline.totalRevenue && !(pipeline.pipeline?.length)) ? (
            <div className="pg-empty">
              <div className="pg-empty__icon">💼</div>
              <div className="pg-empty__title">No pipeline data</div>
              <div className="pg-empty__sub">Add deals in the Pipeline page to see revenue metrics</div>
            </div>
          ) : (
            <>
              <div className="pg-stats" style={{ marginBottom: 20 }}>
                <div className="pg-stat">
                  <div className="pg-stat__top">
                    <span className="pg-stat__label">Revenue Won</span>
                    <div className="pg-stat__icon pg-stat__icon--green">💰</div>
                  </div>
                  <div className="pg-stat__value" style={{ fontSize: 20 }}>{fmtUSD(pipeline?.totalRevenue)}</div>
                </div>
                <div className="pg-stat">
                  <div className="pg-stat__top">
                    <span className="pg-stat__label">New Contacts (30d)</span>
                    <div className="pg-stat__icon pg-stat__icon--blue">👤</div>
                  </div>
                  <div className="pg-stat__value">{pipeline?.newContactsLast30Days ?? 0}</div>
                </div>
              </div>

              <div className="pg-card">
                <div className="pg-card__header"><h3 className="pg-card__title">Pipeline by Stage</h3></div>
                <div className="pg-table-wrap">
                  <table className="pg-table">
                    <thead><tr><th>Stage</th><th>Deals</th><th>Total Value</th><th>Distribution</th></tr></thead>
                    <tbody>
                      {(pipeline?.pipeline || []).map((s) => {
                        const pct = pipeline?.totalRevenue ? Math.round((s.totalValue / pipeline.totalRevenue) * 100) : 0;
                        return (
                          <tr key={s.stage}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[s.stage] || "#94a3b8" }} />
                                <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{s.stage.replace("_"," ")}</span>
                              </div>
                            </td>
                            <td>{s.count}</td>
                            <td style={{ fontWeight: 600 }}>{fmtUSD(s.totalValue)}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--p-border)", overflow: "hidden", minWidth: 80 }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: STAGE_COLORS[s.stage] || "#3b82f6", borderRadius: 2 }} />
                                </div>
                                <span style={{ fontSize: 12, color: "var(--p-muted)", width: 32 }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
