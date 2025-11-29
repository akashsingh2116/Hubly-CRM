// src/apiClient.js
const API_BASE = "http://localhost:5000";

// helper to attach token
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : await res.json();
}

// main API wrapper
export const api = {
  get: async (url) => {
    const res = await fetch(API_BASE + url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse(res);
  },

  post: async (url, data) => {
    const res = await fetch(API_BASE + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  put: async (url, data) => {
    const res = await fetch(API_BASE + url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  patch: async (url, data) => {
    const res = await fetch(API_BASE + url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (url) => {
    const res = await fetch(API_BASE + url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse(res);
  },
};

// auth helpers
export function setCurrentUser(user, token) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getCurrentUser() {
  const json = localStorage.getItem("user");
  return json ? JSON.parse(json) : null;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
export { API_BASE };