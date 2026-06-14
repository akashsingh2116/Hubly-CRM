import React, { useState, useEffect, useRef } from "react";
import { api } from "../apiClient";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ToastContext";

const STAGES = ["lead","qualified","proposal","negotiation","closed_won","closed_lost"];
const STAGE_LABELS = {
  lead: "Lead", qualified: "Qualified", proposal: "Proposal",
  negotiation: "Negotiation", closed_won: "Won", closed_lost: "Lost",
};
const STAGE_COLORS = {
  lead: "#94a3b8", qualified: "#60a5fa", proposal: "#a78bfa",
  negotiation: "#fb923c", closed_won: "#4ade80", closed_lost: "#f87171",
};
const STAGE_BG = {
  lead: "rgba(148,163,184,.1)", qualified: "rgba(96,165,250,.1)",
  proposal: "rgba(167,139,250,.1)", negotiation: "rgba(251,146,60,.1)",
  closed_won: "rgba(74,222,128,.1)", closed_lost: "rgba(248,113,113,.1)",
};

function fmt(val, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(val || 0);
}

function DealModal({ deal, onClose, onSave }) {
  const toast   = useToast();
  const confirm = useConfirm();
  const isEdit  = Boolean(deal?._id);
  const [form, setForm] = useState({
    title: deal?.title || "", stage: deal?.stage || "lead",
    value: deal?.value || 0, currency: deal?.currency || "USD",
    closeDate: deal?.closeDate ? deal.closeDate.slice(0,10) : "",
    description: deal?.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault(); setSaving(true); setErr("");
    try {
      const payload = { ...form, value: Number(form.value) };
      if (deal?._id) await api.patch(`/api/deals/${deal._id}`, payload);
      else           await api.post("/api/deals", payload);
      toast?.success(isEdit ? "Deal updated" : "Deal created");
      onSave(); onClose();
    } catch (e) {
      setErr(e.message || "Failed to save deal");
      toast.error(e.message || "Failed to save deal");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    const ok = await confirm({
      title:        "Delete Deal",
      message:      "Remove this deal from the pipeline? This cannot be undone.",
      confirmLabel: "Delete",
      variant:      "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/deals/${deal._id}`);
      toast.success("Deal deleted");
      onSave();
      onClose();
    } catch (e) {
      toast.error(e.message || "Failed to delete deal");
    }
  }

  return (
    <div className="pg-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pg-modal">
        <div className="pg-modal__header">
          <h2 className="pg-modal__title">{deal ? "Edit Deal" : "New Deal"}</h2>
          <button className="pg-modal__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="pg-modal__body">
            {err && <div className="pg-alert pg-alert--error">⚠ {err}</div>}
            <div className="pg-field"><label>Title <span className="req">*</span></label><input required className="pg-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="pg-field-row">
              <div className="pg-field">
                <label>Stage</label>
                <select className="pg-input" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                  {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="pg-field">
                <label>Value</label>
                <input type="number" min="0" className="pg-input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div className="pg-field">
                <label>Currency</label>
                <select className="pg-input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {["USD","EUR","INR","GBP","AUD"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pg-field">
                <label>Close date</label>
                <input type="date" className="pg-input" value={form.closeDate} onChange={(e) => setForm({ ...form, closeDate: e.target.value })} />
              </div>
            </div>
            <div className="pg-field"><label>Notes</label><textarea className="pg-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div className="pg-modal__footer">
            {isEdit && (
              <button type="button" className="btn2 btn2--danger" style={{ marginRight: "auto" }} onClick={handleDelete}>Delete</button>
            )}
            <button type="button" className="btn2 btn2--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn2 btn2--primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Add deal"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Pipeline() {
  const toast   = useToast();
  const confirm = useConfirm();
  const [pipeline, setPipeline] = useState({});
  const [totals,   setTotals]   = useState({});
  const [modal,    setModal]    = useState(null);
  const dragDeal  = useRef(null);
  const dragStage = useRef(null);
  const [draggingOver, setDraggingOver] = useState(null);

  async function load() {
    try {
      const data = await api.get("/api/deals/pipeline");
      setPipeline(data.pipeline || {});
      setTotals(data.totals || {});
    } catch (err) {
      toast.error(err.message || "Failed to load pipeline");
    }
  }

  useEffect(() => { load(); }, []);

  function onDragStart(deal, stage) { dragDeal.current = deal; dragStage.current = stage; }
  function onDragOver(e, stage) { e.preventDefault(); setDraggingOver(stage); }
  function onDragLeave() { setDraggingOver(null); }

  async function onDrop(targetStage) {
    setDraggingOver(null);
    const deal = dragDeal.current;
    if (!deal || dragStage.current === targetStage) return;
    setPipeline((prev) => {
      const next = { ...prev };
      next[dragStage.current] = (next[dragStage.current] || []).filter((d) => d._id !== deal._id);
      next[targetStage] = [{ ...deal, stage: targetStage }, ...(next[targetStage] || [])];
      return next;
    });
    try {
      await api.patch(`/api/deals/${deal._id}`, { stage: targetStage });
      toast.success(`Deal moved to ${targetStage.replace('_', ' ')}`);
    } catch {
      toast.error("Failed to move deal");
      load();
    }
    dragDeal.current = null; dragStage.current = null;
  }

  const totalWon = (pipeline["closed_won"] || []).reduce((s, d) => s + (d.value || 0), 0);
  const totalAll = Object.values(totals).reduce((s, v) => s + v, 0);

  return (
    <div className="pg" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="pg-header" style={{ flexShrink: 0 }}>
        <div className="pg-header__left">
          <h1 className="pg-title">Sales Pipeline</h1>
          <p className="pg-subtitle">
            Pipeline total: <strong style={{ color: "var(--p-text)" }}>{fmt(totalAll)}</strong>
            &nbsp;·&nbsp; Revenue won: <strong style={{ color: "var(--p-success)" }}>{fmt(totalWon)}</strong>
          </p>
        </div>
        <div className="pg-header__right">
          <button className="btn2 btn2--primary" onClick={() => setModal("new")}>+ New Deal</button>
        </div>
      </div>

      {/* Kanban board */}
      <div style={{
        flex: 1, display: "flex", gap: 12, overflow: "auto",
        paddingBottom: 16, alignItems: "flex-start",
      }}>
        {STAGES.map((stage) => {
          const deals = pipeline[stage] || [];
          const isDragTarget = draggingOver === stage;
          return (
            <div
              key={stage}
              onDragOver={(e) => onDragOver(e, stage)}
              onDragLeave={onDragLeave}
              onDrop={() => onDrop(stage)}
              style={{
                width: 230, flexShrink: 0, display: "flex", flexDirection: "column",
                background: isDragTarget ? STAGE_BG[stage] : "var(--p-surface)",
                border: `1px solid ${isDragTarget ? STAGE_COLORS[stage] : "var(--p-border)"}`,
                borderRadius: 12, overflow: "hidden",
                boxShadow: "var(--p-shadow)", transition: "border-color .15s, background .15s",
                minHeight: 200,
              }}
            >
              {/* Column header */}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--p-border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[stage], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--p-text)" }}>{STAGE_LABELS[stage]}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-muted)", background: "var(--p-surface-2)", padding: "2px 7px", borderRadius: 99, border: "1px solid var(--p-border)" }}>{deals.length}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: STAGE_COLORS[stage] }}>{fmt(totals[stage] || 0)}</div>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
                {deals.map((d) => (
                  <div
                    key={d._id}
                    draggable
                    onDragStart={() => onDragStart(d, stage)}
                    onClick={() => setModal(d)}
                    style={{
                      background: "var(--p-surface-2)", border: "1px solid var(--p-border)",
                      borderRadius: 10, padding: "10px 12px", cursor: "grab",
                      transition: "box-shadow .15s", userSelect: "none",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--p-shadow-md)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-text)", marginBottom: 6 }}>{d.title}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: STAGE_COLORS[stage], marginBottom: 4 }}>{fmt(d.value, d.currency)}</div>
                    {(d.contact || d.company) && (
                      <div style={{ fontSize: 11, color: "var(--p-muted)", display: "flex", flexDirection: "column", gap: 2 }}>
                        {d.contact && <span>👤 {d.contact.firstName} {d.contact.lastName}</span>}
                        {d.company && <span>🏢 {d.company.name}</span>}
                      </div>
                    )}
                    {d.closeDate && (
                      <div style={{ fontSize: 11, color: "var(--p-muted)", marginTop: 4 }}>
                        📅 {new Date(d.closeDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
                {deals.length === 0 && (
                  <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--p-muted)", fontSize: 12 }}>
                    <div style={{ fontSize: 24, marginBottom: 6, opacity: .4 }}>○</div>
                    No deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <DealModal
          deal={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
