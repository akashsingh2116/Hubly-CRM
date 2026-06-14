import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../apiClient";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.get(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        setResults(data.results || []);
        setOpen(true);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(item) {
    setQuery("");
    setOpen(false);
    navigate(item.link);
  }

  return (
    <div className="gsearch" ref={wrapRef}>
      <span className="gsearch__icon">🔍</span>
      <input
        className="gsearch__input"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
      />
      {open && (
        <div className="gsearch__dropdown">
          {results.length === 0 ? (
            <div className="gsearch__empty">No results</div>
          ) : (
            results.map((r) => (
              <div key={`${r.type}-${r.id}`} className="gsearch__item" onClick={() => pick(r)}>
                <span className="gsearch__item-type">{r.type}</span>
                <div className="gsearch__item-text">
                  <div className="gsearch__item-title">{r.title}</div>
                  <div className="gsearch__item-sub">{r.subtitle}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
