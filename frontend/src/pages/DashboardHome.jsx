import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../apiClient";
import { useToast } from "../context/ToastContext";
import useDebounce from "../hooks/useDebounce";
import { DASHBOARD_PAGE_SIZE, SKELETON_TICKET_COUNT, SKELETON_STAT_COUNT } from "../config/constants";
import { avatarColor, nameInitials, timeSince } from "../utils/display";
import "../styles/pages.css";

const STATUS_BADGE = { open: "orange", resolved: "green", "in-progress": "blue" };

const TABS = [
  { key: "all",        label: "All Tickets" },
  { key: "open",       label: "Open"        },
  { key: "in-progress",label: "In Progress" },
  { key: "resolved",   label: "Resolved"    },
];

export default function DashboardHome() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [tickets,      setTickets]      = useState([]);
  const [pagination,   setPagination]   = useState({ total: 0, page: 1, pages: 1 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText,   setSearchText]   = useState("");
  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState({ total: 0, open: 0, resolved: 0, unresolved: 0 });

  const debouncedSearch = useDebounce(searchText);

  const loadTickets = useCallback(async (filter, search, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter, page, limit: DASHBOARD_PAGE_SIZE });
      if (search?.trim()) params.set("search", search.trim());
      const data = await api.get(`/api/tickets?${params}`);
      const sorted = (data.tickets || []).sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      setTickets(sorted);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
      if (page === 1 && filter === "all" && !search) {
        const all = data.tickets || [];
        setStats({
          total:      data.pagination?.total || all.length,
          open:       all.filter(t => t.status === "open").length,
          resolved:   all.filter(t => t.status === "resolved").length,
          unresolved: all.filter(t => !["open","resolved"].includes(t.status)).length,
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTickets(statusFilter, debouncedSearch, 1);
  }, [statusFilter, debouncedSearch, loadTickets]);

  const STAT_CARDS = [
    { label: "Total Tickets", value: pagination.total || stats.total, icon: "🎫", color: "--blue"   },
    { label: "Open",          value: stats.open,                      icon: "📬", color: "--orange" },
    { label: "Resolved",      value: stats.resolved,                  icon: "✅", color: "--green"  },
    { label: "Unresolved",    value: stats.unresolved,                icon: "⚠️", color: "--red"    },
  ];

  return (
    <div className="pg">
      <div className="pg-header">
        <div className="pg-header__left">
          <h1 className="pg-title">Dashboard</h1>
          <p className="pg-subtitle">Monitor and manage all customer tickets</p>
        </div>
        <div className="pg-header__right">
          <button className="btn2 btn2--primary" onClick={() => navigate("/dashboard/contact-center")}>
            + New Ticket
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="pg-stats">
        {loading && tickets.length === 0
          ? [...Array(SKELETON_STAT_COUNT)].map((_, i) => (
              <div key={i} className="pg-stat">
                <div className="sk-rect sk-shimmer" style={{ height: 14, width: "60%", marginBottom: 12 }} />
                <div className="sk-rect sk-shimmer" style={{ height: 32, width: "40%" }} />
              </div>
            ))
          : STAT_CARDS.map((s) => (
              <div className="pg-stat" key={s.label}>
                <div className="pg-stat__top">
                  <span className="pg-stat__label">{s.label}</span>
                  <div className={`pg-stat__icon pg-stat__icon${s.color}`}>{s.icon}</div>
                </div>
                <div className="pg-stat__value">{s.value}</div>
              </div>
            ))}
      </div>

      {/* Search + tabs */}
      <div className="pg-card" style={{ marginBottom: 0 }}>
        <div className="pg-card__header">
          <div className="pg-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`pg-tab${statusFilter === t.key ? " active" : ""}`}
                onClick={() => setStatusFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="pg-search">
            <span className="pg-search__icon">🔍</span>
            <input
              placeholder="Search tickets…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="dh-ticket-list">
            {[...Array(SKELETON_TICKET_COUNT)].map((_, i) => (
              <div key={i} className="dh-ticket" style={{ pointerEvents: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="sk-circle sk-shimmer" style={{ width: 8,  height: 8,  flexShrink: 0 }} />
                  <div className="sk-circle sk-shimmer" style={{ width: 28, height: 28, flexShrink: 0 }} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <div className="sk-line sk-shimmer" style={{ width: "30%" }} />
                  <div className="sk-line sk-shimmer" style={{ width: "55%" }} />
                  <div className="sk-line sk-shimmer" style={{ width: "70%" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                  <div className="sk-line sk-shimmer" style={{ width: 40 }} />
                </div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="pg-empty">
            <div className="pg-empty__icon">🎫</div>
            <div className="pg-empty__title">No tickets found</div>
            <div className="pg-empty__sub">
              {statusFilter !== "all" || debouncedSearch
                ? "Try a different filter or search term"
                : "Customer conversations will appear here"}
            </div>
            {(statusFilter !== "all" || debouncedSearch) && (
              <button
                className="btn2 btn2--ghost btn2--sm pg-empty__cta"
                onClick={() => { setStatusFilter("all"); setSearchText(""); }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="dh-ticket-list">
            {tickets.map((t) => {
              const isResolved = t.status === "resolved";
              const name       = t.customerName || "Unknown";
              const snippet    = isResolved
                ? "Ticket resolved ✓"
                : t.lastMessageSnippet || "No messages yet";
              return (
                <div key={t._id} className="dh-ticket" onClick={() => navigate("/dashboard/contact-center")}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className={`dh-ticket__dot dh-ticket__dot--${isResolved ? "resolved" : "open"}`} />
                    <div className="pg-avatar pg-avatar--sm" style={{ background: avatarColor(name) }}>
                      {nameInitials(name)}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span className="dh-ticket__id">#{t.ticketNumber}</span>
                      <span className={`pg-badge pg-badge--${STATUS_BADGE[t.status] || "gray"}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="dh-ticket__name">{name}</div>
                    <div className="dh-ticket__snippet">{snippet}</div>
                  </div>
                  <div className="dh-ticket__meta">
                    <span className="dh-ticket__time">
                      {timeSince(t.lastMessageAt || t.updatedAt || t.createdAt)}
                    </span>
                    {t.assignedTo && (
                      <span className="pg-badge pg-badge--blue" style={{ fontSize: 10 }}>
                        {t.assignedTo.firstName || "Agent"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="pg-pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => loadTickets(statusFilter, debouncedSearch, pagination.page - 1)}
            >
              ‹ Prev
            </button>
            <span className="pg-pagination__info">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => loadTickets(statusFilter, debouncedSearch, pagination.page + 1)}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
