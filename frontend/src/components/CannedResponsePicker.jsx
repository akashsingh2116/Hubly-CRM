import React, { useState, useEffect } from "react";
import { api } from "../apiClient";

/**
 * Appears above the message input when `trigger` is truthy.
 * Calls onSelect(content) when user picks a response.
 * Calls onClose when dismissed.
 */
export default function CannedResponsePicker({ trigger, onSelect, onClose }) {
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    api.get(`/api/canned-responses?search=${encodeURIComponent(trigger)}`)
      .then((data) => setResponses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [trigger]);

  if (!trigger || responses.length === 0) return null;

  return (
    <div className="canned-picker">
      {responses.map((r) => (
        <div key={r._id} className="canned-picker__item" onClick={() => { onSelect(r.content); onClose(); }}>
          {r.shortcut && <span className="canned-picker__shortcut">{r.shortcut}</span>}
          <span className="canned-picker__name">{r.name}</span>
          <div className="canned-picker__preview">{r.content}</div>
        </div>
      ))}
    </div>
  );
}
