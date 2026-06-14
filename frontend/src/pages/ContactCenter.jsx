import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../apiClient";
import { useSocket } from "../hooks/useSocket";
import CannedResponsePicker from "../components/CannedResponsePicker";
import LabelPicker from "../components/LabelPicker";
import nameIcon        from "../assets/name.png";
import phoneIcon       from "../assets/phone.png";
import emailIcon       from "../assets/email.png";
import ticketStatusIcon from "../assets/ticketstatus.png";
import "../styles/crm.css";

const TYPING_DEBOUNCE_MS = 1500;

export default function ContactCenter() {
  const navigate    = useNavigate();
  const currentUser = getCurrentUser();
  const isAdmin     = currentUser?.role === "admin";

  // ── Socket ──────────────────────────────────────────────────────────────────
  const { socketRef, joinTicket, leaveTicket, emitTypingStart, emitTypingStop } =
    useSocket({ withAuth: true });

  const prevTicketIdRef = useRef(null);
  const typingTimerRef  = useRef(null);

  // ── State ───────────────────────────────────────────────────────────────────
  const [tickets,       setTickets]       = useState([]);
  const [pagination,    setPagination]    = useState({ total: 0, page: 1, limit: 30, pages: 1 });
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [searchText,    setSearchText]    = useState("");

  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeTicket,   setActiveTicket]   = useState(null);

  const [messages,       setMessages]       = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messageInput,   setMessageInput]   = useState("");

  const [loadingTickets,  setLoadingTickets]  = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore,     setLoadingMore]     = useState(false);
  const [sendingFile,     setSendingFile]     = useState(false);

  const [error,           setError]    = useState("");
  const [team,            setTeam]     = useState([]);
  const [customerTyping,  setCustomerTyping]  = useState(false);

  const [showAssignModal,    setShowAssignModal]    = useState(false);
  const [assignTargetUser,   setAssignTargetUser]   = useState(null);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [resolvingTo,        setResolvingTo]        = useState("resolved");
  const [showTeamDropdown,   setShowTeamDropdown]   = useState(false);
  const [isInternalNote,     setIsInternalNote]     = useState(false);
  const [cannedTrigger,      setCannedTrigger]      = useState("");
  const [notes,              setNotes]              = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);

  // ── Load tickets ─────────────────────────────────────────────────────────────
  const loadTickets = useCallback(
    async (filterStatus = statusFilter, search = searchText, page = 1) => {
      try {
        setLoadingTickets(true);
        setError("");

        const params = new URLSearchParams({ status: filterStatus, page, limit: 30 });
        if (search.trim()) params.set("search", search.trim());

        const data = await api.get(`/api/tickets?${params}`);
        setTickets(data.tickets || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 30, pages: 1 });

        if (!activeTicketId && data.tickets?.length > 0) {
          setActiveTicketId(data.tickets[0]._id);
        }
      } catch (err) {
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoadingTickets(false);
      }
    },
    [statusFilter, searchText, activeTicketId]
  );

  // ── Load messages ─────────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (ticketId, before = null) => {
    if (!ticketId) return;
    try {
      before ? setLoadingMore(true) : setLoadingMessages(true);
      setError("");

      const params = new URLSearchParams({ limit: 50 });
      if (before) params.set("before", before);

      const data = await api.get(`/api/messages/ticket/${ticketId}?${params}`);

      if (before) {
        setMessages((prev) => [...(data.messages || []), ...prev]);
      } else {
        setMessages(data.messages || []);
      }
      setHasMoreMessages(data.hasMore || false);
    } catch (err) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  }, []);

  const loadTeam = useCallback(async () => {
    try {
      const users = await api.get("/api/users");
      setTeam(users || []);
    } catch {
      /* non-critical */
    }
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return navigate("/login");
    loadTickets();
    loadTeam();
  }, []);

  // ── Scroll to bottom on new messages ─────────────────────────────────────────
  useEffect(() => {
    if (!loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── Switch ticket: leave old room, join new ────────────────────────────────
  useEffect(() => {
    if (!activeTicketId) {
      setActiveTicket(null);
      setMessages([]);
      return;
    }

    const t = tickets.find((tk) => tk._id === activeTicketId);
    setActiveTicket(t || null);

    if (prevTicketIdRef.current && prevTicketIdRef.current !== activeTicketId) {
      leaveTicket(prevTicketIdRef.current);
    }

    joinTicket(activeTicketId);
    prevTicketIdRef.current = activeTicketId;
    setCustomerTyping(false);

    if (t) loadMessages(t._id);
  }, [activeTicketId, tickets]);

  // ── Socket listeners ──────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onNewMessage = (msg) => {
      if (msg.ticket === activeTicketId || msg.ticket?._id === activeTicketId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          return exists ? prev : [...prev, msg];
        });
        setCustomerTyping(false);
      }
      // Update snippet in ticket list
      setTickets((prev) =>
        prev.map((t) =>
          t._id === (msg.ticket || msg.ticket?._id)
            ? { ...t, lastMessageSnippet: msg.text, lastMessageAt: msg.createdAt, lastMessageFrom: msg.senderType }
            : t
        )
      );
    };

    const onTicketUpdated = (updated) => {
      setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      if (updated._id === activeTicketId) setActiveTicket(updated);
    };

    const onTypingStart = ({ senderType }) => {
      if (senderType === "customer") setCustomerTyping(true);
    };

    const onTypingStop = ({ senderType }) => {
      if (senderType === "customer") setCustomerTyping(false);
    };

    socket.on("new-message",    onNewMessage);
    socket.on("ticket-updated", onTicketUpdated);
    socket.on("typing-start",   onTypingStart);
    socket.on("typing-stop",    onTypingStop);

    return () => {
      socket.off("new-message",    onNewMessage);
      socket.off("ticket-updated", onTicketUpdated);
      socket.off("typing-start",   onTypingStart);
      socket.off("typing-stop",    onTypingStop);
    };
  }, [socketRef.current, activeTicketId]);

  // ── Typing indicator (debounced) ──────────────────────────────────────────────
  function handleMessageInputChange(e) {
    const val = e.target.value;
    setMessageInput(val);

    // Canned responses: detect "/" trigger
    const match = val.match(/(?:^|\s)(\/\w*)$/);
    setCannedTrigger(match ? match[1] : "");

    if (!activeTicketId || isInternalNote) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    emitTypingStart(activeTicketId);

    typingTimerRef.current = setTimeout(() => {
      emitTypingStop(activeTicketId);
    }, TYPING_DEBOUNCE_MS);
  }

  // Load internal notes for active ticket
  useEffect(() => {
    if (!activeTicketId) { setNotes([]); return; }
    api.get(`/api/activities?ticket=${activeTicketId}&page=1&limit=20`)
      .then((d) => setNotes(d.activities || []))
      .catch(() => {});
  }, [activeTicketId]);

  async function saveInternalNote() {
    if (!messageInput.trim() || !activeTicket) return;
    try {
      await api.post("/api/activities", {
        type:       "note",
        body:       messageInput.trim(),
        ticket:     activeTicket._id,
        isInternal: true,
        title:      "Internal Note",
      });
      setMessageInput("");
      // Reload notes
      const d = await api.get(`/api/activities?ticket=${activeTicket._id}&page=1&limit=20`);
      setNotes(d.activities || []);
    } catch (err) {
      setError(err.message || "Failed to save note");
    }
  }

  async function handleLabelChange(labels) {
    if (!activeTicket) return;
    try {
      const updated = await api.patch(`/api/tickets/${activeTicket._id}/labels`, { labels });
      setActiveTicket(updated);
      setTickets((prev) => prev.map((t) => t._id === updated._id ? updated : t));
    } catch { /* ignore */ }
  }

  // ── Send text message ─────────────────────────────────────────────────────────
  const canReply =
    activeTicket &&
    activeTicket.assignedTo?._id === currentUser?.id &&
    activeTicket.status !== "resolved";

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!activeTicket || !messageInput.trim()) return;

    if (isInternalNote) {
      await saveInternalNote();
      return;
    }

    if (!canReply) return;

    clearTimeout(typingTimerRef.current);
    emitTypingStop(activeTicketId);

    try {
      await api.post(`/api/messages/ticket/${activeTicket._id}`, {
        text: messageInput.trim(),
      });
      setMessageInput("");
      setCannedTrigger("");
    } catch (err) {
      setError(err.message || "Failed to send");
    }
  }

  // ── File upload ───────────────────────────────────────────────────────────────
  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file || !activeTicket || !canReply) return;

    try {
      setSendingFile(true);
      const uploaded = await api.upload(file);
      await api.post(`/api/messages/ticket/${activeTicket._id}`, {
        text: "",
        attachments: [
          {
            url:          uploaded.url,
            filename:     uploaded.filename,
            originalName: uploaded.originalName,
            mimetype:     uploaded.mimetype,
            size:         uploaded.size,
          },
        ],
      });
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setSendingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Load older messages ────────────────────────────────────────────────────────
  async function handleLoadMore() {
    if (!activeTicketId || !hasMoreMessages || messages.length === 0) return;
    await loadMessages(activeTicketId, messages[0]._id);
  }

  // ── Assign ────────────────────────────────────────────────────────────────────
  async function handleConfirmAssign() {
    if (!assignTargetUser || !activeTicket) return;
    try {
      await api.patch(`/api/tickets/${activeTicket._id}/assign`, {
        assignedToUserId: assignTargetUser._id,
      });
      setShowAssignModal(false);
      setShowTeamDropdown(false);
      await loadTickets(statusFilter, searchText, pagination.page);
    } catch (err) {
      setError(err.message || "Failed to assign");
    }
  }

  // ── Resolve ───────────────────────────────────────────────────────────────────
  async function handleConfirmResolve() {
    try {
      await api.patch(`/api/tickets/${activeTicket._id}/status`, { status: resolvingTo });
      setShowResolveConfirm(false);
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function initials(name) {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length === 1
      ? p[0][0].toUpperCase()
      : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  function isCustomerMessage(msg) {
    return msg.senderType === "customer" || msg.senderType === "user";
  }

  function renderAttachments(attachments = []) {
    return attachments.map((att, i) => {
      const isImage = att.mimetype?.startsWith("image/");
      return (
        <div key={i} className="cc-attachment">
          {isImage ? (
            <a href={att.url} target="_blank" rel="noreferrer">
              <img
                src={att.url}
                alt={att.originalName || att.filename}
                className="cc-attachment-img"
              />
            </a>
          ) : (
            <a
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className="cc-attachment-file"
            >
              📎 {att.originalName || att.filename}
            </a>
          )}
        </div>
      );
    });
  }

  const createdDateLabel = activeTicket
    ? new Date(activeTicket.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day:   "numeric",
        year:  "numeric",
      })
    : "";

  const dropdownLabel = (() => {
    if (assignTargetUser)
      return `${assignTargetUser.firstName} ${assignTargetUser.lastName}`;
    if (activeTicket?.assignedTo)
      return `${activeTicket.assignedTo.firstName} ${activeTicket.assignedTo.lastName}`;
    return "Select teammate";
  })();

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="cc-layout">
      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
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
                  (t._id === activeTicketId ? " cc-chat-list-item--active" : "")
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="cc-pagination">
            <button
              className="cc-page-btn"
              disabled={pagination.page === 1}
              onClick={() => loadTickets(statusFilter, searchText, pagination.page - 1)}
            >
              ‹
            </button>
            <span className="cc-page-info">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              className="cc-page-btn"
              disabled={pagination.page >= pagination.pages}
              onClick={() => loadTickets(statusFilter, searchText, pagination.page + 1)}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* ── MIDDLE: MESSAGES ────────────────────────────────────────────────── */}
      <div className="cc-main-panel">
        <div className="cc-main-header">
          <div className="cc-ticket-title">
            Ticket# {activeTicket?.ticketNumber || "—"}
          </div>
          <button className="cc-home-btn" onClick={() => navigate("/dashboard")}>
            <span className="cc-home-icon" />
          </button>
        </div>

        <div className="cc-messages-area">
          {activeTicket ? (
            <>
              <div className="cc-date-separator">
                <span>{createdDateLabel}</span>
              </div>

              {/* Load older messages */}
              {hasMoreMessages && (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <button
                    className="cc-load-more-btn"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load older messages"}
                  </button>
                </div>
              )}

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
                              ? `${activeTicket.assignedTo.firstName} ${activeTicket.assignedTo.lastName}`
                              : "Agent"}
                          </div>
                          {m.text && (
                            <div className="cc-message-text">{m.text}</div>
                          )}
                          {m.attachments?.length > 0 &&
                            renderAttachments(m.attachments)}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {customerTyping && (
                  <div className="cc-message-row cc-message-row--user">
                    <div className="cc-message-avatar-dot" />
                    <div className="cc-message-bubble cc-typing-bubble">
                      <span className="cc-typing-dot" />
                      <span className="cc-typing-dot" />
                      <span className="cc-typing-dot" />
                    </div>
                  </div>
                )}

                {activeTicket.isMissed && (
                  <div className="cc-missed-note">Replying to missed chat</div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className="cc-empty-list">Select a chat</div>
          )}
        </div>

        {/* Input row */}
        <div style={{ borderTop: "1px solid var(--color-border, #e5e7eb)" }}>
          {/* Toggle: Reply / Internal Note */}
          <div style={{ display: "flex", gap: 0, padding: "6px 12px 0" }}>
            <button
              type="button"
              style={{
                padding: "4px 12px", fontSize: 12, cursor: "pointer",
                borderRadius: "6px 0 0 6px", border: "1px solid var(--color-border, #e5e7eb)",
                background: !isInternalNote ? "#2b6cb0" : "transparent",
                color: !isInternalNote ? "#fff" : "inherit",
              }}
              onClick={() => setIsInternalNote(false)}
            >Reply</button>
            <button
              type="button"
              style={{
                padding: "4px 12px", fontSize: 12, cursor: "pointer",
                borderRadius: "0 6px 6px 0", border: "1px solid var(--color-border, #e5e7eb)",
                borderLeft: "none",
                background: isInternalNote ? "#f59e0b" : "transparent",
                color: isInternalNote ? "#fff" : "inherit",
              }}
              onClick={() => setIsInternalNote(true)}
            >📝 Note</button>
          </div>

          {/* Canned response picker */}
          <div style={{ position: "relative" }}>
            {cannedTrigger && !isInternalNote && (
              <CannedResponsePicker
                trigger={cannedTrigger}
                onSelect={(content) => {
                  setMessageInput((prev) => prev.replace(/\/\w*$/, content));
                  setCannedTrigger("");
                }}
                onClose={() => setCannedTrigger("")}
              />
            )}
          </div>

          <form className="cc-input-row" onSubmit={handleSendMessage} style={{ border: 0 }}>
            {/* File upload (only for reply mode) */}
            {!isInternalNote && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  className="cc-attach-btn"
                  disabled={!canReply || sendingFile}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  {sendingFile ? "⏳" : "📎"}
                </button>
              </>
            )}

            <input
              className="cc-input"
              placeholder={
                isInternalNote
                  ? "Write internal note (not visible to customer)…"
                  : !canReply
                  ? "You cannot reply to this chat"
                  : "Type here or / for canned responses"
              }
              value={messageInput}
              onChange={handleMessageInputChange}
              disabled={!isInternalNote && !canReply}
              style={isInternalNote ? { background: "#fffbeb" } : {}}
            />
            <button
              className="cc-send-btn"
              type="submit"
              disabled={(!isInternalNote && !canReply) || !messageInput.trim()}
            >
              <span className="cc-send-icon">➜</span>
            </button>
          </form>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="cc-details-panel">
        {activeTicket ? (
          <>
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

            <div className="cc-details-section">
              <div className="cc-details-section-title">Details</div>

              <div className="cc-details-field">
                <img src={nameIcon}  alt="name"  className="cc-details-icon-img" />
                <div className="cc-details-field-main">{activeTicket.customerName}</div>
                <div className="cc-details-field-meta">1</div>
              </div>
              <div className="cc-details-field">
                <img src={phoneIcon} alt="phone" className="cc-details-icon-img" />
                <div className="cc-details-field-main">
                  {activeTicket.customerPhone || "+91 0000000000"}
                </div>
              </div>
              <div className="cc-details-field">
                <img src={emailIcon} alt="email" className="cc-details-icon-img" />
                <div className="cc-details-field-main">
                  {activeTicket.customerEmail || "example@gmail.com"}
                </div>
              </div>
            </div>

            <div className="cc-details-section">
              <div className="cc-details-section-title">Assigned To</div>

              <div className="cc-details-select">
                <div className="cc-details-select-main">
                  <div className="cc-details-select-avatar" />
                  <span>
                    {activeTicket.assignedTo
                      ? `${activeTicket.assignedTo.firstName} ${activeTicket.assignedTo.lastName}`
                      : "Unassigned"}
                  </span>
                </div>
              </div>

              <div className="cc-details-section-subtitle">All team members</div>

              <div
                className="cc-details-select"
                onClick={() => isAdmin && setShowTeamDropdown((p) => !p)}
                style={{ cursor: isAdmin ? "pointer" : "default" }}
              >
                <div className="cc-details-select-main">
                  <div className="cc-details-select-avatar" />
                  <span>{dropdownLabel}</span>
                </div>
                <div className="cc-details-select-caret" />
              </div>

              {showTeamDropdown && (
                <div className="cc-details-assign-list">
                  {team.map((u) => (
                    <button
                      key={u._id}
                      className="cc-details-assign-item"
                      disabled={!isAdmin}
                      onClick={() => {
                        setAssignTargetUser(u);
                        setShowAssignModal(true);
                        setShowTeamDropdown(false);
                      }}
                    >
                      <div className="cc-details-select-avatar" />
                      <span>
                        {u.firstName} {u.lastName}
                        {u.role === "admin" ? " (Admin)" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}

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
                    (activeTicket.status === "resolved" ? " cc-status-option--active" : "")
                  }
                  onClick={() => { setResolvingTo("resolved"); setShowResolveConfirm(true); }}
                >
                  Resolved
                </button>
                <button
                  type="button"
                  className={
                    "cc-status-option" +
                    (activeTicket.status !== "resolved" ? " cc-status-option--active" : "")
                  }
                  onClick={() => { setResolvingTo("open"); setShowResolveConfirm(true); }}
                >
                  Unresolved
                </button>
              </div>
            </div>

            {/* Labels */}
            <div className="cc-details-section">
              <div className="cc-details-section-title">Labels</div>
              <LabelPicker
                labels={activeTicket.labels || []}
                onChange={handleLabelChange}
              />
            </div>

            {/* Internal Notes */}
            {notes.length > 0 && (
              <div className="cc-details-section">
                <div className="cc-details-section-title">Internal Notes</div>
                {notes.map((n) => (
                  <div key={n._id} className="internal-note" style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>
                      {n.owner?.firstName} {n.owner?.lastName}
                    </div>
                    <div style={{ fontSize: 12 }}>{n.body}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="cc-empty-list">Select a chat</div>
        )}

        {/* Assign Popup */}
        {showAssignModal && assignTargetUser && (
          <div className="cc-dialog">
            <div className="cc-dialog-body">
              Assign chat to {assignTargetUser.firstName} {assignTargetUser.lastName}?
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
            <div className="cc-dialog-body">
              {resolvingTo === "resolved" ? "Mark this chat as resolved?" : "Reopen this chat?"}
            </div>
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
            position: "fixed",
            left: 24,
            bottom: 16,
            fontSize: 12,
            color: "red",
            background: "#fff5f5",
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid #fcc",
          }}
        >
          {error}
          <button
            onClick={() => setError("")}
            style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "red" }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
