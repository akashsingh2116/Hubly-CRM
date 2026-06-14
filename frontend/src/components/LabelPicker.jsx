import React, { useState } from "react";

const PRESET_LABELS = ["urgent", "billing", "technical", "feedback", "sales", "bug"];

/**
 * Inline label editor.
 * `labels` — current string[], `onChange(labels)` — called after each change.
 */
export default function LabelPicker({ labels = [], onChange }) {
  const [inputVal, setInputVal] = useState("");

  function add(label) {
    const clean = label.trim().toLowerCase();
    if (!clean || labels.includes(clean)) return;
    onChange([...labels, clean]);
    setInputVal("");
  }

  function remove(label) {
    onChange(labels.filter((l) => l !== label));
  }

  function handleKey(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(inputVal);
    } else if (e.key === "Backspace" && !inputVal && labels.length > 0) {
      remove(labels[labels.length - 1]);
    }
  }

  return (
    <div className="label-picker">
      {labels.map((l) => (
        <span key={l} className="label-tag">
          {l}
          <button onClick={() => remove(l)} title="Remove">×</button>
        </span>
      ))}
      <input
        className="label-add-input"
        placeholder="+ label"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => inputVal && add(inputVal)}
      />
      {PRESET_LABELS.filter((p) => !labels.includes(p)).map((p) => (
        <span
          key={p}
          style={{ fontSize: 11, color: "var(--color-text-muted)", cursor: "pointer", padding: "2px 6px", borderRadius: 99, border: "1px dashed var(--color-border)" }}
          onClick={() => add(p)}
        >
          +{p}
        </span>
      ))}
    </div>
  );
}
