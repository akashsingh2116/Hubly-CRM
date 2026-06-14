const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const ct   = res.headers.get("content-type") || "";
      const body = ct.includes("application/json")
        ? await res.json()
        : { message: await res.text() };
      message = body.message || body.error || message;
    } catch {
      // ignore parse errors
    }
    const err    = new Error(message);
    err.status   = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

function buildHeaders(extra = {}) {
  return { "Content-Type": "application/json", ...getAuthHeaders(), ...extra };
}

export const api = {
  get: (url) =>
    fetch(API_BASE + url, { method: "GET", headers: buildHeaders() }).then(
      handleResponse
    ),

  post: (url, data) =>
    fetch(API_BASE + url, {
      method:  "POST",
      headers: buildHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  put: (url, data) =>
    fetch(API_BASE + url, {
      method:  "PUT",
      headers: buildHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  patch: (url, data) =>
    fetch(API_BASE + url, {
      method:  "PATCH",
      headers: buildHeaders(),
      body:    JSON.stringify(data),
    }).then(handleResponse),

  delete: (url) =>
    fetch(API_BASE + url, { method: "DELETE", headers: buildHeaders() }).then(
      handleResponse
    ),

  /** Upload a file (multipart/form-data). Returns { url, filename, ... } */
  upload: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method:  "POST",
      headers: getAuthHeaders(), // no Content-Type — let browser set multipart boundary
      body:    fd,
    });
    return handleResponse(res);
  },
};

// ── Auth helpers ──────────────────────────────────────────────────────────────
export function setCurrentUser(user, token) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getCurrentUser() {
  try {
    const json = localStorage.getItem("user");
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export { API_BASE };
