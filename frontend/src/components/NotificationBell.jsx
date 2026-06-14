import React, { useState, useEffect, useRef } from "react";
import { api } from "../apiClient";

export default function NotificationBell({ socketRef }) {
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  async function load() {
    try {
      const data = await api.get("/api/notifications?limit=20");
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  // Real-time push from socket
  useEffect(() => {
    const sock = socketRef?.current;
    if (!sock) return;
    function onNotif(n) {
      setNotifs((prev) => [n, ...prev].slice(0, 20));
      setUnread((c) => c + 1);
    }
    sock.on("notification", onNotif);
    return () => sock.off("notification", onNotif);
  }, [socketRef?.current]);

  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markRead(id) {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnread((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }

  async function markAll() {
    try {
      await api.patch("/api/notifications/read-all");
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* ignore */ }
  }

  return (
    <div className="notif-bell" ref={wrapRef}>
      <button className="notif-bell__btn" onClick={() => setOpen((o) => !o)} title="Notifications">
        🔔
        {unread > 0 && <span className="notif-bell__badge">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="notif-bell__dropdown">
          <div className="notif-bell__header">
            <span>Notifications</span>
            {unread > 0 && <button className="btn btn-sm btn-secondary" onClick={markAll}>Mark all read</button>}
          </div>
          <div className="notif-bell__list">
            {notifs.length === 0 ? (
              <div className="notif-bell__empty">No notifications yet</div>
            ) : notifs.map((n) => (
              <div
                key={n._id}
                className={`notif-bell__item${n.isRead ? "" : " notif-bell__item--unread"}`}
                onClick={() => { if (!n.isRead) markRead(n._id); }}
              >
                {!n.isRead && <div className="notif-bell__dot" />}
                <div style={{ flex: 1 }}>
                  <div className="notif-bell__text">{n.title}</div>
                  <div className="notif-bell__sub">{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
