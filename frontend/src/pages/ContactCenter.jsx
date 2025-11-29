// src/pages/ContactCenter.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../apiClient";
import nameIcon from "../assets/name.png";
import phoneIcon from "../assets/phone.png";
import emailIcon from "../assets/email.png";
import ticketStatusIcon from "../assets/ticketstatus.png";

export default function ContactCenter() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [error, setError] = useState("");

  const [team, setTeam] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetUser, setAssignTargetUser] = useState(null);

  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [resolvingTo, setResolvingTo] = useState("resolved");

  const isAdmin = currentUser?.role === "admin";

  // -------------------- LOAD TICKETS --------------------
  async function loadTickets(filterStatus = statusFilter, search = searchText) {
    try {
      setLoadingTickets(true);
      setError("");

      const params = new URLSearchParams();
      if (filterStatus === "resolved") params.set("status", "resolved");
      else if (filterStatus === "unresolved")
        params.set("status", "unresolved");
      else params.set("status", "all");

      if (search.trim()) params.set("search", search.trim());

      const data = await api.get(`/api/tickets?${params.toString()}`);
      setTickets(data || []);

      if (!activeTicketId && data.length > 0) {
        setActiveTicketId(data[0]._id);
      }
    } catch (err) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }

  // -------------------- LOAD MESSAGES --------------------
  async function loadMessages(ticketId) {
    if (!ticketId) return;
    try {
      setLoadingMessages(true);
      setError("");

      const data = await api.get(`/api/messages/ticket/${ticketId}`);
      setMessages(data || []);
    } catch (err) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }

  // -------------------- LOAD TEAM --------------------
  async function loadTeam() {
    try {
      const users = await api.get("/api/users");
      setTeam(users || []);
    } catch (err) {
      console.error("Failed to load team", err);
    }
  }

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    loadTickets();
    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeTicketId) {
      setActiveTicket(null);
      setMessages([]);
      return;
    }
    const t = tickets.find((tk) => tk._id === activeTicketId);
    setActiveTicket(t || null);
    if (t) loadMessages(t._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTicketId, tickets]);

  // -------------------- SEND MESSAGE --------------------
  const canReply =
    activeTicket &&
    activeTicket.assignedTo &&
    activeTicket.assignedTo._id === currentUser?.id &&
    activeTicket.status !== "resolved";

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!activeTicket || !messageInput.trim() || !canReply) return;

    try {
      const newMsg = await api.post(
        `/api/messages/ticket/${activeTicket._id}`,
        { text: messageInput.trim() }
      );

      setMessages((prev) => [...prev, newMsg]);
      setMessageInput("");

      await loadTickets(statusFilter, searchText);
    } catch (err) {
      setError(err.message || "Failed to send");
    }
  }

  // -------------------- ASSIGN TEAMMATE --------------------
  function openAssignModal(user) {
    if (!isAdmin || !activeTicket) return;
    setAssignTargetUser(user);
    setShowAssignModal(true);
  }

  async function handleConfirmAssign() {
    if (!assignTargetUser || !activeTicket) return;

    try {
      await api.patch(`/api/tickets/${activeTicket._id}/assign`, {
        assignedToUserId: assignTargetUser._id,
      });
      setShowAssignModal(false);
      await loadTickets(statusFilter, searchText);
    } catch (err) {
      setError(err.message || "Failed to assign");
    }
  }

  // -------------------- RESOLVE STATUS --------------------
  function openResolveConfirm(newStatus) {
    setResolvingTo(newStatus);
    setShowResolveConfirm(true);
  }

  async function handleConfirmResolve() {
    try {
      await api.patch(`/api/tickets/${activeTicket._id}/status`, {
        status: resolvingTo,
      });
      setShowResolveConfirm(false);
      await loadTickets(statusFilter, searchText);
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  }

  // -------------------- HELPERS --------------------
  function initials(name) {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length === 1
      ? p[0][0].toUpperCase()
      : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  const createdDateLabel = activeTicket
    ? new Date(activeTicket.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  function isCustomerMessage(msg) {
    return msg.senderType === "customer" || msg.senderType === "user";
  }

  // ===============================================================
  // UI START
  // ===============================================================

  return (
    <div className="cc-layout">
      {/* ---------------- LEFT PANEL ---------------- */}
      <div className="cc-list-panel">
        <div className="cc-page-title">Contact Center</div>
        <div className="cc-list-label">Chats</div>

        <div className="cc-chat-list">
          {loadingTickets ? (
            <div className="cc-empty-list">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="cc-empty-list">No chats</div>
          ) : (
            tickets.map((t) => (
              <button
                key={t._id}
                className={
                  "cc-chat-list-item" +
                  (t._id === activeTicketId
                    ? " cc-chat-list-item--active"
                    : "")
                }
                onClick={() => setActiveTicketId(t._id)}
              >
                <div className="cc-chat-avatar">{initials(t.customerName)}</div>

                <div className="cc-chat-list-text">
                  <div className="cc-chat-list-name">{t.customerName}</div>
                  <div className="cc-chat-list-snippet">
                    {t.isMissed
                      ? "Missed chat"
                      : t.status === "resolved"
                      ? "Chat resolved"
                      : t.lastMessageSnippet || "No messages yet"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ---------------- MIDDLE: MESSAGES ---------------- */}
      <div className="cc-main-panel">
        <div className="cc-main-header">
          <div className="cc-ticket-title">
            Ticket# {activeTicket?.ticketNumber || "—"}
          </div>

          <button
            className="cc-home-btn"
            onClick={() => navigate("/dashboard")}
          >
            <span className="cc-home-icon" />
          </button>
        </div>

        <div className="cc-messages-area">
          {activeTicket ? (
            <>
              <div className="cc-date-separator">
                <span>{createdDateLabel}</span>
              </div>

              <div className="cc-messages-scroll">
                {loadingMessages ? (
                  <div className="cc-empty-list">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="cc-empty-list">No messages yet</div>
                ) : (
                  messages.map((m) => {
                    const customer = isCustomerMessage(m);

                    return (
                      <div
                        key={m._id}
                        className={
                          "cc-message-row " +
                          (customer
                            ? "cc-message-row--user"
                            : "cc-message-row--agent")
                        }
                      >
                        <div className="cc-message-avatar-dot" />
                        <div className="cc-message-bubble">
                          <div className="cc-message-author">
                            {customer
                              ? activeTicket.customerName
                              : activeTicket.assignedTo
                              ? activeTicket.assignedTo.firstName +
                                " " +
                                activeTicket.assignedTo.lastName
                              : "Agent"}
                          </div>
                          <div className="cc-message-text">{m.text}</div>
                        </div>
                      </div>
                    );
                  })
                )}

                {activeTicket.isMissed && (
                  <div className="cc-missed-note">
                    Replying to missed chat
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="cc-empty-list">Select a chat</div>
          )}
        </div>

        {/* Input Row */}
        <form className="cc-input-row" onSubmit={handleSendMessage}>
          <input
            className="cc-input"
            placeholder={
              !canReply ? "You cannot reply to this chat" : "Type here"
            }
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={!canReply}
          />
          <button
            className="cc-send-btn"
            type="submit"
            disabled={!canReply || !messageInput.trim()}
          >
            <span className="cc-send-icon">➜</span>
          </button>
        </form>
      </div>

      {/* ---------------- RIGHT PANEL ---------------- */}
      <div className="cc-details-panel">
        {activeTicket ? (
          <>
            {/* Header */}
            <div className="cc-details-header">
              <div className="cc-details-header-initial">
                {initials(activeTicket.customerName)}
              </div>

              <div className="cc-details-header-text">
                <div className="cc-details-header-name">
                  {activeTicket.customerName}
                </div>
                <div className="cc-details-header-label">Chat</div>
              </div>
            </div>

            {/* DETAILS CARD */}
            <div className="cc-details-section">
              <div className="cc-details-section-title">Details</div>

              {/* Name */}
              <div className="cc-details-field">
                <img
                  src={nameIcon}
                  alt="name"
                  className="cc-details-icon-img"
                />
                <div className="cc-details-field-main">
                  {activeTicket.customerName}
                </div>
                <div className="cc-details-field-meta">1</div>
              </div>

              {/* Phone */}
              <div className="cc-details-field">
                <img
                  src={phoneIcon}
                  alt="phone"
                  className="cc-details-icon-img"
                />
                <div className="cc-details-field-main">
                  {activeTicket.customerPhone || "+91 0000000000"}
                </div>
              </div>

              {/* Email */}
              <div className="cc-details-field">
                <img
                  src={emailIcon}
                  alt="email"
                  className="cc-details-icon-img"
                />
                <div className="cc-details-field-main">
                  {activeTicket.customerEmail || "example@gmail.com"}
                </div>
              </div>
            </div>

            {/* TEAMMATES / STATUS */}
            <div className="cc-details-section">
              <div className="cc-details-section-title">Teammates</div>

              <div className="cc-details-select">
                <div
                  className="cc-details-select-main"
                  onClick={() => {
                    if (isAdmin) {
                      setAssignTargetUser(activeTicket.assignedTo || team[0]);
                      setShowAssignModal(true);
                    }
                  }}
                >
                  <div className="cc-details-select-avatar" />
                  <span>
                    {activeTicket.assignedTo
                      ? `${activeTicket.assignedTo.firstName} ${activeTicket.assignedTo.lastName}`
                      : "Assign teammate"}
                  </span>
                </div>
                <div className="cc-details-select-caret" />
              </div>

              <div className="cc-details-section-subtitle">
                All team members
              </div>
              <div className="cc-details-assign-list">
                {team.map((u) => (
                  <button
                    key={u._id}
                    className="cc-details-assign-item"
                    disabled={!isAdmin}
                    onClick={() => openAssignModal(u)}
                  >
                    <div className="cc-details-select-avatar" />
                    <span>
                      {u.firstName} {u.lastName}
                      {u.role === "admin" ? " (Admin)" : ""}
                    </span>
                  </button>
                ))}
              </div>

              {/* Ticket status */}
              <div className="cc-details-section-subtitle cc-details-subtitle-with-icon">
                <img
                  src={ticketStatusIcon}
                  alt="ticket status"
                  className="cc-details-icon-img cc-details-icon-inline"
                />
                <span>Ticket status</span>
              </div>

              <div className="cc-status-options">
                <button
                  type="button"
                  className={
                    "cc-status-option" +
                    (activeTicket.status === "resolved"
                      ? " cc-status-option--active"
                      : "")
                  }
                  onClick={() => openResolveConfirm("resolved")}
                >
                  Resolved
                </button>
                <button
                  type="button"
                  className={
                    "cc-status-option" +
                    (activeTicket.status !== "resolved"
                      ? " cc-status-option--active"
                      : "")
                  }
                  onClick={() => openResolveConfirm("open")}
                >
                  Unresolved
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="cc-empty-list">Select a chat</div>
        )}

        {/* Assign Popup */}
        {showAssignModal && assignTargetUser && (
          <div className="cc-dialog">
            <div className="cc-dialog-body">
              Assign chat to {assignTargetUser.firstName}{" "}
              {assignTargetUser.lastName}?
            </div>

            <div className="cc-dialog-actions">
              <button
                className="cc-dialog-btn cc-dialog-btn--ghost"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="cc-dialog-btn cc-dialog-btn--primary"
                onClick={handleConfirmAssign}
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* Resolve Popup */}
        {showResolveConfirm && (
          <div className="cc-dialog">
            <div className="cc-dialog-body">Close this chat?</div>

            <div className="cc-dialog-actions">
              <button
                className="cc-dialog-btn cc-dialog-btn--ghost"
                onClick={() => setShowResolveConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="cc-dialog-btn cc-dialog-btn--primary"
                onClick={handleConfirmResolve}
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            position: "absolute",
            left: 24,
            bottom: 16,
            fontSize: 12,
            color: "red",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
