import React, { useState, useEffect, useCallback } from "react";
import { api } from "../apiClient";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ToastContext";
import useDebounce from "../hooks/useDebounce";
import { PAGE_SIZE, SKELETON_ROW_COUNT } from "../config/constants";
import { avatarColor, initials } from "../utils/display";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES   = ["todo", "in_progress", "done"];

const PRIORITY_BADGE = { low: "gray", medium: "blue", high: "orange", urgent: "red" };
const STATUS_BADGE   = { todo: "gray", in_progress: "purple", done: "green" };

function TaskModal({ task, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title:       task?.title                               || "",
    description: task?.description                        || "",
    assignedTo:  task?.assignedTo?._id || task?.assignedTo || "",
    priority:    task?.priority                           || "medium",
    status:      task?.status                             || "todo",
    dueDate:     task?.dueDate ? task.dueDate.slice(0, 10) : "",
  });
  const [users,  setUsers]  = useState([]);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  useEffect(() => {
    api.get("/api/users")
      .then((d) => setUsers(Array.isArray(d) ? d : d.users || []))
      .catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (task?._id) {
        await api.patch(`/api/tasks/${task._id}`, form);
        toast.success("Task updated");
      } else {
        await api.post("/api/tasks", form);
        toast.success("Task created");
      }
      onSaved();
      onClose();
    } catch (err) {
      setErr(err.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pg-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pg-modal">
        <div className="pg-modal__header">
          <h2 className="pg-modal__title">{task ? "Edit Task" : "New Task"}</h2>
          <button className="pg-modal__close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="pg-modal__body">
            {err && <div className="pg-alert pg-alert--error">⚠ {err}</div>}
            <div className="pg-field">
              <label>Title <span className="req">*</span></label>
              <input required className="pg-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="pg-field">
              <label>Description</label>
              <textarea className="pg-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="pg-field-row">
              <div className="pg-field">
                <label>Assign to <span className="req">*</span></label>
                <select required className="pg-input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">— Select agent —</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="pg-field">
                <label>Priority</label>
                <select className="pg-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="pg-field">
                <label>Status</label>
                <select className="pg-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div className="pg-field">
                <label>Due date</label>
                <input type="date" className="pg-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="pg-modal__footer">
            <button type="button" className="btn2 btn2--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn2 btn2--primary" disabled={saving}>
              {saving ? "Saving…" : task ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function isOverdue(t) {
  return t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date();
}

export default function Tasks() {
  const toast   = useToast();
  const confirm = useConfirm();

  const [tasks,      setTasks]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter,     setFilter]     = useState({ status: "" });
  const [rawSearch,  setRawSearch]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(null);

  const debouncedSearch = useDebounce(rawSearch);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE, ...filter });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const data = await api.get(`/api/tasks?${params}`);
      setTasks(data.tasks || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch, toast]);

  useEffect(() => { load(1); }, [load]);

  async function toggleDone(task) {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await api.patch(`/api/tasks/${task._id}`, { status: newStatus });
      load(pagination.page);
      toast[newStatus === "done" ? "success" : "info"](
        newStatus === "done" ? "Task marked as done" : "Task reopened"
      );
    } catch (err) {
      toast.error(err.message || "Failed to update task");
    }
  }

  async function deleteTask(id) {
    const ok = await confirm({
      title:        "Delete Task",
      message:      "Are you sure you want to delete this task? This cannot be undone.",
      confirmLabel: "Delete",
      variant:      "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      toast.success("Task deleted");
      load(pagination.page);
    } catch (err) {
      toast.error(err.message || "Failed to delete task");
    }
  }

  const done  = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;

  return (
    <div className="pg">
      <div className="pg-header">
        <div className="pg-header__left">
          <h1 className="pg-title">Tasks</h1>
          <p className="pg-subtitle">{done} of {total} tasks completed</p>
        </div>
        <div className="pg-header__right">
          <div className="pg-search" style={{ maxWidth: 220 }}>
            <span className="pg-search__icon">🔍</span>
            <input
              placeholder="Search tasks…"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
            />
          </div>
          <select
            className="pg-select"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          <button className="btn2 btn2--primary" onClick={() => setModal("new")}>+ New Task</button>
        </div>
      </div>

      {loading ? (
        <div className="task-list">
          {[...Array(SKELETON_ROW_COUNT)].map((_, i) => (
            <div key={i} className="task-card">
              <div className="sk-shimmer" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="sk-line sk-shimmer" style={{ width: "45%" }} />
                <div className="sk-line sk-shimmer" style={{ width: "25%" }} />
              </div>
              <div className="sk-rect sk-shimmer" style={{ width: 60, height: 20, borderRadius: 99 }} />
              <div className="sk-rect sk-shimmer" style={{ width: 70, height: 28, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="pg-card">
          <div className="pg-empty">
            <div className="pg-empty__icon">✓</div>
            <div className="pg-empty__title">
              {rawSearch || filter.status ? "No tasks match" : "No tasks yet"}
            </div>
            <div className="pg-empty__sub">
              {rawSearch || filter.status
                ? "Try a different search or filter"
                : "Create a task to track follow-ups and to-dos"}
            </div>
            {rawSearch || filter.status ? (
              <button
                className="btn2 btn2--ghost btn2--sm pg-empty__cta"
                onClick={() => { setRawSearch(""); setFilter({ status: "" }); }}
              >
                Clear filters
              </button>
            ) : (
              <button className="btn2 btn2--primary btn2--sm pg-empty__cta" onClick={() => setModal("new")}>
                + Create Task
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((t) => {
            const isDone   = t.status === "done";
            const overdue  = isOverdue(t);
            const assignee = t.assignedTo;
            const aName    = assignee
              ? `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim()
              : "";
            return (
              <div key={t._id} className={`task-card${isDone ? " task-card--done" : ""}`}>
                <button
                  className={`task-card__check${isDone ? " task-card__check--done" : ""}`}
                  onClick={() => toggleDone(t)}
                  aria-label={isDone ? "Reopen task" : "Mark as done"}
                >
                  {isDone ? "✓" : ""}
                </button>

                <div className="task-card__body">
                  <div className={`task-card__title${isDone ? " task-card__title--done" : ""}`}>
                    {t.title}
                  </div>
                  <div className="task-card__meta">
                    <span className={`pg-badge pg-badge--${PRIORITY_BADGE[t.priority] || "gray"}`}>
                      {t.priority}
                    </span>
                    <span className={`pg-badge pg-badge--${STATUS_BADGE[t.status] || "gray"}`}>
                      {t.status.replace("_", " ")}
                    </span>
                    {t.dueDate && (
                      <span className={`task-card__due${overdue ? " task-card__due--overdue" : ""}`}>
                        {overdue ? "⚠" : "📅"} {new Date(t.dueDate).toLocaleDateString()}
                        {overdue && <span style={{ fontSize: 11 }}>(overdue)</span>}
                      </span>
                    )}
                    {t.description && (
                      <span className="task-card__desc">{t.description}</span>
                    )}
                  </div>
                </div>

                {assignee && (
                  <div className="task-card__assignee">
                    <div className="pg-avatar pg-avatar--sm" style={{ background: avatarColor(aName) }}>
                      {initials(assignee.firstName, assignee.lastName)}
                    </div>
                    <span className="task-card__assignee-name">{aName}</span>
                  </div>
                )}

                <div className="task-card__actions">
                  <button className="btn2 btn2--ghost btn2--sm btn2--icon" onClick={() => setModal(t)} aria-label="Edit task">✏️</button>
                  <button className="btn2 btn2--danger btn2--sm btn2--icon" onClick={() => deleteTask(t._id)} aria-label="Delete task">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pg-pagination" style={{ background: "transparent" }}>
          <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>← Prev</button>
          <span className="pg-pagination__info">
            Page {pagination.page} of {pagination.pages} · {pagination.total} total
          </span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next →</button>
        </div>
      )}

      {modal && (
        <TaskModal
          task={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => load(pagination.page)}
        />
      )}
    </div>
  );
}
