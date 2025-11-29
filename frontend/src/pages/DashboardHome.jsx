// src/pages/DashboardHome.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../apiClient";

export default function DashboardHome() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all"); // all | resolved | unresolved
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- helpers ----------

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  async function loadTickets(filterStatus = statusFilter, search = searchText) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filterStatus === "resolved") params.set("status", "resolved");
      else if (filterStatus === "unresolved") params.set("status", "unresolved");
      else params.set("status", "all");

      if (search.trim()) params.set("search", search.trim());

      const data = await api.get(`/api/tickets?${params.toString()}`);

      // make sure newest are on top
      const sorted = (data || []).slice().sort((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt).getTime();
        const tb = new Date(b.updatedAt || b.createdAt).getTime();
        return tb - ta;
      });

      setTickets(sorted);
    } catch (err) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }

  // ---------- effects ----------

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- event handlers ----------

  function handleChangeTab(tab) {
    setStatusFilter(tab);
    loadTickets(tab, searchText);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadTickets(statusFilter, searchText);
  }

  function handleOpenTicket(t) {
    // optional: remember chosen ticket for Contact Center
    // localStorage.setItem("hublySelectedTicketId", t._id);
    navigate("/contact-center");
  }

  // ---------- render ----------

  return (
    <div className="dash-page">
      {/* Header */}
      <header className="dash-page-header">
        <h1 className="dash-page-title">Dashboard</h1>
      </header>

      {/* Search bar */}
      <form className="dash-search-row" onSubmit={handleSearchSubmit}>
        <div className="dash-search-box">
          <span className="dash-search-icon" />
          <input
            type="text"
            placeholder="Search for ticket"
            className="dash-search-input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </form>

      {/* Tabs */}
      <div className="dash-tabs-row">
        <button
          type="button"
          className={"dash-tab" + (statusFilter === "all" ? " active" : "")}
          onClick={() => handleChangeTab("all")}
        >
          All Tickets
        </button>
        <button
          type="button"
          className={
            "dash-tab" + (statusFilter === "resolved" ? " active" : "")
          }
          onClick={() => handleChangeTab("resolved")}
        >
          Resolved
        </button>
        <button
          type="button"
          className={
            "dash-tab" + (statusFilter === "unresolved" ? " active" : "")
          }
          onClick={() => handleChangeTab("unresolved")}
        >
          Unresolved
        </button>
      </div>

      {/* Tickets list */}
      <section className="dash-ticket-section">
        {error && (
          <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="dash-empty">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="dash-empty">No tickets found</div>
        ) : (
          <div className="dash-ticket-list">
            {tickets.map((t) => {
              const isResolved = t.status === "resolved";

              const mainLine = isResolved
                ? "Ticket has been resolved"
                : t.lastMessageSnippet || "No messages yet";

              const lastUserOrResolvedTime = isResolved
                ? t.resolvedAt || t.updatedAt
                : t.lastMessageAt || t.updatedAt || t.createdAt;

              const postedLabel = formatTime(t.createdAt);
              const timeLabel = formatTime(lastUserOrResolvedTime);

              return (
                <article
                  key={t._id}
                  className="dash-ticket-card"
                  onClick={() => handleOpenTicket(t)}
                >
                  {/* Top row */}
                  <div className="dash-ticket-top">
                    <div className="dash-ticket-title-left">
                      <span className="dash-ticket-status-dot" />
                      <span className="dash-ticket-id">
                        Ticket# {t.ticketNumber}
                      </span>
                    </div>
                    <span className="dash-ticket-meta">
                      {postedLabel && `Posted at ${postedLabel}`}
                    </span>
                  </div>

                  {/* Middle row */}
                  <div className="dash-ticket-middle">
                    <span className="dash-ticket-message">{mainLine}</span>
                    <span className="dash-ticket-time">{timeLabel}</span>
                  </div>

                  {/* Bottom row */}
                  <div className="dash-ticket-bottom">
                    <div className="dash-ticket-user">
                      <div className="dash-ticket-user-avatar" />
                      <div className="dash-ticket-user-text">
                        <div className="dash-ticket-user-name">
                          {t.customerName}
                        </div>
                        <div className="dash-ticket-user-meta">
                          {t.customerPhone}
                        </div>
                        <div className="dash-ticket-user-meta">
                          {t.customerEmail}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
