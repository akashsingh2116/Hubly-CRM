import React, { useEffect, useMemo, useState } from "react";
import { api, getCurrentUser } from "../apiClient";
import "../styles/pages.css";

function avatarColor(name = "") {
  const colors = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#14b8a6"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}
function initials(first = "", last = "") {
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

const EMPTY_FORM = { firstName: "", lastName: "", email: "", phone: "" };

export default function TeamManagement() {
  const [team,        setTeam]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [modalMode,   setModalMode]   = useState("add");
  const [editUser,    setEditUser]    = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [sortDir,     setSortDir]     = useState("asc");
  const [deleteUser,  setDeleteUser]  = useState(null);
  const [search,      setSearch]      = useState("");

  const currentUser = getCurrentUser();
  const isAdmin     = currentUser?.role === "admin";

  async function loadTeam() {
    try {
      setLoading(true); setError("");
      setTeam(await api.get("/api/users"));
    } catch (err) { setError(err.message || "Failed to load team"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadTeam(); }, []);

  const sortedTeam = useMemo(() => {
    const filtered = team.filter((u) => {
      const name = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
      return name.includes(search.toLowerCase());
    });
    return filtered.sort((a, b) => {
      const na = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nb = `${b.firstName} ${b.lastName}`.toLowerCase();
      return sortDir === "asc" ? na.localeCompare(nb) : nb.localeCompare(na);
    });
  }, [team, sortDir, search]);

  function openAdd() {
    setModalMode("add"); setEditUser(null);
    setForm(EMPTY_FORM); setError(""); setShowModal(true);
  }
  function openEdit(u) {
    setModalMode("edit"); setEditUser(u);
    setForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email || "", phone: u.phone || "" });
    setError(""); setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault(); setError("");
    const { firstName, lastName, email, phone } = form;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name and email are required."); return;
    }
    try {
      if (modalMode === "add") {
        await api.post("/api/users", { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), phone: phone.trim() });
      } else {
        await api.patch(`/api/users/${editUser._id}`, { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });
      }
      setShowModal(false); await loadTeam();
    } catch (err) { setError(err.message || "Failed to save"); }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    try {
      await api.delete(`/api/users/${deleteUser._id}`);
      setDeleteUser(null); await loadTeam();
    } catch (err) { setError(err.message || "Failed to delete"); }
  }

  return (
    <div className="pg">
      <div className="pg-header">
        <div className="pg-header__left">
          <h1 className="pg-title">Team</h1>
          <p className="pg-subtitle">{team.length} member{team.length !== 1 ? "s" : ""} in your workspace</p>
        </div>
        {isAdmin && (
          <div className="pg-header__right">
            <button className="btn2 btn2--primary" onClick={openAdd}>+ Add member</button>
          </div>
        )}
      </div>

      {error && <div className="pg-alert pg-alert--error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      <div className="pg-card">
        <div className="pg-card__header">
          <div className="pg-search" style={{ maxWidth: 300 }}>
            <span className="pg-search__icon">🔍</span>
            <input placeholder="Search members…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ fontSize: 13, color: "var(--p-muted)" }}>
            {sortedTeam.length} of {team.length} members
          </div>
        </div>

        {loading ? (
          <div className="pg-loading"><div className="pg-spinner" /> Loading team…</div>
        ) : sortedTeam.length === 0 ? (
          <div className="pg-empty">
            <div className="pg-empty__icon">👥</div>
            <div className="pg-empty__title">No team members yet</div>
            <div className="pg-empty__sub">Add your first team member to get started</div>
            {isAdmin && <button className="btn2 btn2--primary" onClick={openAdd} style={{ marginTop: 8 }}>+ Add member</button>}
          </div>
        ) : (
          <div className="pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
                    Name {sortDir === "asc" ? "↑" : "↓"}
                  </th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedTeam.map((u) => {
                  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
                  const canEdit = isAdmin && u.role !== "admin";
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="pg-name-cell">
                          <div className="pg-avatar" style={{ background: avatarColor(name) }}>
                            {initials(u.firstName, u.lastName)}
                          </div>
                          <div className="pg-name-cell__info">
                            <span className="pg-name-cell__name">{name || "—"}</span>
                            <span className="pg-name-cell__sub">
                              {u._id === currentUser?._id || u._id === currentUser?.id ? "You" : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--p-muted)", fontSize: 13 }}>{u.email}</td>
                      <td style={{ color: "var(--p-muted)", fontSize: 13 }}>{u.phone || "—"}</td>
                      <td>
                        <span className={`team-role-badge team-role-badge--${u.role === "admin" ? "admin" : "member"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {canEdit && (
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button className="btn2 btn2--ghost btn2--sm btn2--icon" onClick={() => openEdit(u)} title="Edit">✏️</button>
                            <button className="btn2 btn2--danger btn2--sm btn2--icon" onClick={() => setDeleteUser(u)} title="Delete">🗑</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="pg-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="pg-modal">
            <div className="pg-modal__header">
              <h2 className="pg-modal__title">{modalMode === "add" ? "Add team member" : "Edit team member"}</h2>
              <button className="pg-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="pg-modal__body">
                {error && <div className="pg-alert pg-alert--error">⚠ {error}</div>}
                <div className="pg-field-row">
                  <div className="pg-field">
                    <label>First name</label>
                    <input className="pg-input" value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} required />
                  </div>
                  <div className="pg-field">
                    <label>Last name</label>
                    <input className="pg-input" value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} required />
                  </div>
                </div>
                <div className="pg-field">
                  <label>Email address</label>
                  <input className="pg-input" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required disabled={modalMode === "edit"} />
                </div>
                <div className="pg-field">
                  <label>Phone number</label>
                  <input className="pg-input" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="pg-field">
                  <label>Role</label>
                  <div className="pg-input" style={{ opacity: .6, cursor: "not-allowed" }}>Member (agents cannot be promoted to admin)</div>
                </div>
              </div>
              <div className="pg-modal__footer">
                <button type="button" className="btn2 btn2--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn2 btn2--primary">
                  {modalMode === "add" ? "Add member" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteUser && (
        <div className="pg-modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteUser(null)}>
          <div className="pg-modal" style={{ maxWidth: 400 }}>
            <div className="pg-modal__header">
              <h2 className="pg-modal__title">Remove team member</h2>
              <button className="pg-modal__close" onClick={() => setDeleteUser(null)}>✕</button>
            </div>
            <div className="pg-modal__body">
              <p style={{ margin: 0, fontSize: 14, color: "var(--p-text-2)", lineHeight: 1.6 }}>
                Are you sure you want to remove <strong>{deleteUser.firstName} {deleteUser.lastName}</strong>?
                Their tickets will be reassigned to the admin.
              </p>
            </div>
            <div className="pg-modal__footer">
              <button className="btn2 btn2--ghost" onClick={() => setDeleteUser(null)}>Cancel</button>
              <button className="btn2 btn2--danger" onClick={handleDelete}>Remove member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
