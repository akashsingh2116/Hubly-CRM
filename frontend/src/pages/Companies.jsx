import React, { useState, useEffect, useCallback } from "react";
import { api } from "../apiClient";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ToastContext";
import useDebounce from "../hooks/useDebounce";
import { PAGE_SIZE, SKELETON_ROW_COUNT } from "../config/constants";
import { avatarColor } from "../utils/display";

const INDUSTRIES = ["SaaS", "Fintech", "E-commerce", "Healthcare", "Retail", "Manufacturing", "Other"];

function CompanyModal({ company, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name:     company?.name     || "",
    industry: company?.industry || "",
    website:  company?.website  || "",
    phone:    company?.phone    || "",
    address:  company?.address  || "",
    notes:    company?.notes    || "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (company?._id) {
        await api.patch(`/api/companies/${company._id}`, form);
        toast.success("Company updated");
      } else {
        await api.post("/api/companies", form);
        toast.success("Company created");
      }
      onSaved();
      onClose();
    } catch (err) {
      setErr(err.message || "Failed to save company");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pg-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pg-modal">
        <div className="pg-modal__header">
          <h2 className="pg-modal__title">{company ? "Edit Company" : "New Company"}</h2>
          <button className="pg-modal__close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="pg-modal__body">
            {err && <div className="pg-alert pg-alert--error">⚠ {err}</div>}
            <div className="pg-field">
              <label>Company name <span className="req">*</span></label>
              <input className="pg-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="pg-field-row">
              <div className="pg-field">
                <label>Industry</label>
                <select className="pg-input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                  <option value="">— Select —</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="pg-field">
                <label>Phone</label>
                <input className="pg-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="pg-field">
              <label>Website</label>
              <input className="pg-input" type="url" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className="pg-field">
              <label>Address</label>
              <input className="pg-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="pg-field">
              <label>Notes</label>
              <textarea className="pg-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="pg-modal__footer">
            <button type="button" className="btn2 btn2--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn2 btn2--primary" disabled={saving}>
              {saving ? "Saving…" : company ? "Save changes" : "Add company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Companies() {
  const toast   = useToast();
  const confirm = useConfirm();

  const [companies,  setCompanies]  = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(null); // null | "new" | companyObj

  const debouncedSearch = useDebounce(search);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE, search: debouncedSearch });
      const data = await api.get(`/api/companies?${params}`);
      setCompanies(data.companies || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => { load(1); }, [load]);

  async function deleteCompany(id) {
    const ok = await confirm({
      title:        "Delete Company",
      message:      "Linked contacts will be unlinked. This cannot be undone.",
      confirmLabel: "Delete",
      variant:      "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/companies/${id}`);
      toast.success("Company deleted");
      load(pagination.page);
    } catch (err) {
      toast.error(err.message || "Failed to delete company");
    }
  }

  const SkeletonRows = () => (
    <>
      {[...Array(SKELETON_ROW_COUNT)].map((_, i) => (
        <tr key={i} className="sk-row">
          <td>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="sk-shimmer" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
              <div className="sk-line sk-shimmer" style={{ width: "55%" }} />
            </div>
          </td>
          <td><div className="sk-line sk-shimmer" style={{ width: "50%" }} /></td>
          <td><div className="sk-line sk-shimmer" style={{ width: "60%" }} /></td>
          <td><div className="sk-line sk-shimmer" style={{ width: "65%" }} /></td>
          <td><div className="sk-line sk-shimmer" style={{ width: "40%" }} /></td>
          <td>
            <div className="td-actions">
              <div className="sk-rect sk-shimmer" style={{ width: 40, height: 26, borderRadius: 6 }} />
              <div className="sk-rect sk-shimmer" style={{ width: 52, height: 26, borderRadius: 6 }} />
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="pg">
      <div className="pg-header">
        <div className="pg-header__left">
          <h1 className="pg-title">Companies</h1>
          <p className="pg-subtitle">
            {pagination.total} compan{pagination.total !== 1 ? "ies" : "y"} in your CRM
          </p>
        </div>
        <div className="pg-header__right">
          <button className="btn2 btn2--primary" onClick={() => setModal("new")}>+ New Company</button>
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card__header">
          <div className="pg-search">
            <span className="pg-search__icon">🔍</span>
            <input
              placeholder="Search by company name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="pg-table-wrap">
          <table className="pg-table">
            <thead>
              <tr>
                <th>Company</th><th>Industry</th><th>Phone</th><th>Website</th><th>Contacts</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="pg-empty">
                      <div className="pg-empty__icon">🏢</div>
                      <div className="pg-empty__title">
                        {debouncedSearch ? `No companies match "${debouncedSearch}"` : "No companies yet"}
                      </div>
                      <div className="pg-empty__sub">
                        {debouncedSearch
                          ? "Try a different search term or clear the search."
                          : "Add your first company to get started."}
                      </div>
                      {debouncedSearch ? (
                        <button className="btn2 btn2--ghost btn2--sm pg-empty__cta" onClick={() => setSearch("")}>
                          Clear search
                        </button>
                      ) : (
                        <button className="btn2 btn2--primary btn2--sm pg-empty__cta" onClick={() => setModal("new")}>
                          + Add Company
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : companies.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="pg-name-cell">
                      <div
                        className="pg-avatar pg-avatar--sm"
                        style={{ background: avatarColor(c.name), borderRadius: 6 }}
                      >
                        {(c.name?.[0] ?? "?").toUpperCase()}
                      </div>
                      <span className="pg-name-cell__name">{c.name}</span>
                    </div>
                  </td>
                  <td>{c.industry ? <span className="pg-badge pg-badge--blue">{c.industry}</span> : "—"}</td>
                  <td className="td-muted">{c.phone || "—"}</td>
                  <td>
                    {c.website ? (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--p-primary)", textDecoration: "none", fontSize: 13 }}
                      >
                        {c.website.replace(/^https?:\/\//, "").split("/")[0]}
                      </a>
                    ) : "—"}
                  </td>
                  <td>
                    <span className="pg-badge pg-badge--gray">
                      {c.contactCount || 0} contact{c.contactCount !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn2 btn2--ghost btn2--sm" onClick={() => setModal(c)}>Edit</button>
                      <button className="btn2 btn2--danger btn2--sm" onClick={() => deleteCompany(c._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
        <CompanyModal
          company={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => load(pagination.page)}
        />
      )}
    </div>
  );
}
