import React, { useState, useEffect, useCallback } from "react";
import { api } from "../apiClient";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ToastContext";
import useDebounce from "../hooks/useDebounce";
import { PAGE_SIZE, SKELETON_ROW_COUNT } from "../config/constants";
import { avatarColor, initials } from "../utils/display";

const STATUS_OPTIONS = ["lead", "prospect", "customer", "churned", "inactive"];
const STATUS_BADGE   = { lead: "orange", prospect: "blue", customer: "green", churned: "gray", inactive: "gray" };

function ContactModal({ contact, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    firstName: contact?.firstName || "",
    lastName:  contact?.lastName  || "",
    email:     contact?.email     || "",
    phone:     contact?.phone     || "",
    status:    contact?.status    || "lead",
    notes:     contact?.notes     || "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (contact?._id) {
        await api.patch(`/api/contacts/${contact._id}`, form);
        toast.success("Contact updated");
      } else {
        await api.post("/api/contacts", form);
        toast.success("Contact created");
      }
      onSaved();
      onClose();
    } catch (err) {
      setErr(err.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pg-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pg-modal">
        <div className="pg-modal__header">
          <h2 className="pg-modal__title">{contact ? "Edit Contact" : "New Contact"}</h2>
          <button className="pg-modal__close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="pg-modal__body">
            {err && <div className="pg-alert pg-alert--error">⚠ {err}</div>}
            <div className="pg-field-row">
              <div className="pg-field">
                <label>First name <span className="req">*</span></label>
                <input className="pg-input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="pg-field">
                <label>Last name</label>
                <input className="pg-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="pg-field">
              <label>Email</label>
              <input className="pg-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="pg-field">
              <label>Phone</label>
              <input className="pg-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="pg-field">
              <label>Status</label>
              <select className="pg-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="pg-field">
              <label>Notes</label>
              <textarea className="pg-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="pg-modal__footer">
            <button type="button" className="btn2 btn2--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn2 btn2--primary" disabled={saving}>
              {saving ? "Saving…" : contact ? "Save changes" : "Add contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Contacts() {
  const toast   = useToast();
  const confirm = useConfirm();

  const [contacts,   setContacts]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(null); // null | "new" | contactObj

  const debouncedSearch = useDebounce(search);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE, search: debouncedSearch });
      if (status) params.set("status", status);
      const data = await api.get(`/api/contacts?${params}`);
      setContacts(data.contacts || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, toast]);

  useEffect(() => { load(1); }, [load]);

  async function deleteContact(id, name) {
    const ok = await confirm({
      title:        "Delete Contact",
      message:      `Remove ${name} from your CRM? This cannot be undone.`,
      confirmLabel: "Delete",
      variant:      "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/contacts/${id}`);
      toast.success("Contact deleted");
      load(pagination.page);
    } catch (err) {
      toast.error(err.message || "Failed to delete contact");
    }
  }

  const SkeletonRows = () => (
    <div className="pg-table-wrap">
      <table className="pg-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Company</th><th></th></tr>
        </thead>
        <tbody>
          {[...Array(SKELETON_ROW_COUNT)].map((_, i) => (
            <tr key={i} className="sk-row">
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="sk-circle sk-shimmer" style={{ width: 26, height: 26, flexShrink: 0 }} />
                  <div className="sk-line sk-shimmer" style={{ width: 90 }} />
                </div>
              </td>
              <td><div className="sk-line sk-shimmer" style={{ width: 130 }} /></td>
              <td><div className="sk-line sk-shimmer" style={{ width: 90 }} /></td>
              <td><div className="sk-rect sk-shimmer" style={{ width: 60, height: 20, borderRadius: 99 }} /></td>
              <td><div className="sk-line sk-shimmer" style={{ width: 80 }} /></td>
              <td>
                <div className="td-actions">
                  <div className="sk-rect sk-shimmer" style={{ width: 40, height: 26, borderRadius: 6 }} />
                  <div className="sk-rect sk-shimmer" style={{ width: 52, height: 26, borderRadius: 6 }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="pg">
      <div className="pg-header">
        <div className="pg-header__left">
          <h1 className="pg-title">Contacts</h1>
          <p className="pg-subtitle">{pagination.total} contact{pagination.total !== 1 ? "s" : ""} in your CRM</p>
        </div>
        <div className="pg-header__right">
          <button className="btn2 btn2--primary" onClick={() => setModal("new")}>+ New Contact</button>
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card__header">
          <div className="pg-search">
            <span className="pg-search__icon">🔍</span>
            <input
              placeholder="Search by name, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="pg-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : (
          <div className="pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Company</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="pg-empty">
                        <div className="pg-empty__icon">👤</div>
                        <div className="pg-empty__title">
                          {search || status ? "No contacts match" : "No contacts yet"}
                        </div>
                        <div className="pg-empty__sub">
                          {search || status
                            ? "Try a different search or filter"
                            : "Add your first contact to get started"}
                        </div>
                        {search || status ? (
                          <button className="btn2 btn2--ghost btn2--sm pg-empty__cta" onClick={() => { setSearch(""); setStatus(""); }}>
                            Clear filters
                          </button>
                        ) : (
                          <button className="btn2 btn2--primary btn2--sm pg-empty__cta" onClick={() => setModal("new")}>
                            + Add Contact
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : contacts.map((c) => {
                  const name = `${c.firstName || ""} ${c.lastName || ""}`.trim();
                  return (
                    <tr key={c._id}>
                      <td>
                        <div className="pg-name-cell">
                          <div className="pg-avatar pg-avatar--sm" style={{ background: avatarColor(name) }}>
                            {initials(c.firstName, c.lastName)}
                          </div>
                          <div className="pg-name-cell__info">
                            <span className="pg-name-cell__name">{name || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="td-muted">{c.email || "—"}</td>
                      <td className="td-muted">{c.phone || "—"}</td>
                      <td><span className={`pg-badge pg-badge--${STATUS_BADGE[c.status] || "gray"}`}>{c.status}</span></td>
                      <td className="td-muted">{c.company?.name || "—"}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn2 btn2--ghost btn2--sm" onClick={() => setModal(c)}>Edit</button>
                          <button className="btn2 btn2--danger btn2--sm" onClick={() => deleteContact(c._id, name)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="pg-pagination">
            <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>← Prev</button>
            <span className="pg-pagination__info">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next →</button>
          </div>
        )}
      </div>

      {modal && (
        <ContactModal
          contact={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => load(pagination.page)}
        />
      )}
    </div>
  );
}
