import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { TOAST_DURATION_MS, TOAST_MAX_STACK } from "../config/constants";

const ToastCtx   = createContext(null);
const ConfirmCtx = createContext(null);
let _id = 0;

const TOAST_ICONS = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };

export function ToastProvider({ children }) {
  const [toasts,  setToasts]  = useState([]);
  const [confirm, setConfirm] = useState(null);
  const resolveRef = useRef(null);

  const addToast = useCallback((type, message) => {
    const id = ++_id;
    setToasts(prev => [...prev.slice(-(TOAST_MAX_STACK - 1)), { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION_MS);
  }, []);

  const toast = {
    success: m => addToast("success", m),
    error:   m => addToast("error",   m),
    info:    m => addToast("info",    m),
    warning: m => addToast("warning", m),
  };

  const dismiss = id => setToasts(prev => prev.filter(t => t.id !== id));

  const openConfirm = useCallback(opts => new Promise(resolve => {
    resolveRef.current = resolve;
    setConfirm(opts);
  }), []);

  function handleAnswer(ok) {
    setConfirm(null);
    resolveRef.current?.(ok);
  }

  return (
    <ToastCtx.Provider value={toast}>
      <ConfirmCtx.Provider value={openConfirm}>
        {children}

        {/* ── Toast stack ─────────────────────────────────────── */}
        <div className="toast-stack">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast--${t.type}`}>
              <span className="toast__icon">{TOAST_ICONS[t.type]}</span>
              <span className="toast__msg">{t.message}</span>
              <button className="toast__close" onClick={() => dismiss(t.id)}>✕</button>
            </div>
          ))}
        </div>

        {/* ── Confirm dialog ──────────────────────────────────── */}
        {confirm && (
          <div className="pg-modal-overlay" style={{ zIndex: 10000 }} onClick={e => e.target === e.currentTarget && handleAnswer(false)}>
            <div className="pg-modal" style={{ maxWidth: 400 }}>
              <div className="pg-modal__header">
                <h2 className="pg-modal__title">{confirm.title || "Are you sure?"}</h2>
                <button className="pg-modal__close" onClick={() => handleAnswer(false)}>✕</button>
              </div>
              <div className="pg-modal__body">
                <p style={{ margin: 0, fontSize: 14, color: "var(--p-muted)", lineHeight: 1.6 }}>
                  {confirm.message}
                </p>
              </div>
              <div className="pg-modal__footer">
                <button className="btn2 btn2--ghost" onClick={() => handleAnswer(false)}>Cancel</button>
                <button
                  className={`btn2 ${confirm.variant === "danger" ? "btn2--danger" : "btn2--primary"}`}
                  onClick={() => handleAnswer(true)}
                >
                  {confirm.confirmLabel || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}

export const useToast   = () => useContext(ToastCtx);
export const useConfirm = () => useContext(ConfirmCtx);
