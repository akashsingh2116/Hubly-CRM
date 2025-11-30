// src/pages/TeamManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api, getCurrentUser } from "../apiClient";

export default function TeamManagement() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [editUser, setEditUser] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // 🔹 sort state: asc / desc
  const [sortDirection, setSortDirection] = useState("asc");

  const currentUser = getCurrentUser();

  function isAdmin() {
    return currentUser?.role === "admin";
  }

  // ---------- LOAD TEAM ----------
  async function loadTeam() {
    try {
      setLoading(true);
      setError("");
      const users = await api.get("/api/users");
      setTeam(users);
    } catch (err) {
      setError(err.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  // 🔹 derive sorted list based on sortDirection
  const sortedTeam = useMemo(() => {
    const copy = [...team];
    copy.sort((a, b) => {
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`
        .trim()
        .toLowerCase();
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`
        .trim()
        .toLowerCase();

      if (sortDirection === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
    return copy;
  }, [team, sortDirection]);

  // toggle sort when clicking header
  function handleToggleSort() {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  // ---------- MODAL OPEN / CLOSE ----------
  function openAddModal() {
    setModalMode("add");
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    setEditUser(null);
    setShowAddModal(true);
    setError("");
  }

  function openEditModal(user) {
    setModalMode("edit");
    setEditUser(user);
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "", // shown but disabled
      phone: user.phone || "",
    });
    setShowAddModal(true);
    setError("");
  }

  // ---------- SAVE (ADD / EDIT) ----------
  async function handleSave(e) {
    e.preventDefault();
    setError("");

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
    };

    if (!payload.firstName || !payload.lastName || !payload.email) {
      setError("First name, last name and email are required.");
      return;
    }

    try {
      if (modalMode === "add") {
        // backend will always set role = "member"
        await api.post("/api/users", payload);
      } else if (modalMode === "edit" && editUser) {
        // email & role not editable; only send editable fields
        await api.patch(`/api/users/${editUser._id}`, {
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
        });
      }

      setShowAddModal(false);
      await loadTeam();
    } catch (err) {
      setError(err.message || "Failed to save");
    }
  }

  // ---------- DELETE ----------
  function confirmDelete(user) {
    setDeletingUser(user);
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingUser) return;
    try {
      await api.delete(`/api/users/${deletingUser._id}`);
      setShowDeleteConfirm(false);
      setDeletingUser(null);
      await loadTeam();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  }

  // ---------- RENDER ----------
  const isAdminUser = isAdmin();

  return (
    <div className="tm-page">
      <header className="tm-header">
        <h1 className="tm-title">Team</h1>
      </header>

      <div className="tm-content">
        {error && (
          <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
            {error}
          </div>
        )}

        <div className="tm-table-wrapper">
          <table className="tm-table">
            <thead>
              <tr>
                <th
                  className="tm-col-name"
                  onClick={handleToggleSort}
                  style={{ cursor: "pointer" }}
                >
                  Full Name{" "}
                  <span className="tm-sort-indicator">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                </th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
                <th className="tm-col-actions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading...</td>
                </tr>
              ) : sortedTeam.length === 0 ? (
                <tr>
                  <td colSpan={5}>No team members yet</td>
                </tr>
              ) : (
                sortedTeam.map((user, index) => {
                  const isUserAdmin = user.role === "admin";
                  const canEditDelete = isAdminUser && !isUserAdmin; // cannot edit/delete admin

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="tm-name-cell">
                          <div
                            className={`tm-avatar tm-avatar-${
                              (index % 4) + 1
                            }`}
                          />
                          <span>
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td>{user.phone || "-"}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td className="tm-actions-cell">
                        {canEditDelete && (
                          <>
                            <button
                              className="tm-icon-btn tm-icon-edit"
                              aria-label="Edit teammate"
                              onClick={() => openEditModal(user)}
                            />
                            <button
                              className="tm-icon-btn tm-icon-delete"
                              aria-label="Delete teammate"
                              onClick={() => confirmDelete(user)}
                            />
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {isAdminUser && (
          <div className="tm-add-btn-row">
            <button className="tm-add-btn" onClick={openAddModal}>
              <span className="tm-add-icon">+</span>
              <span>Add Team members</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showAddModal && (
        <div className="tm-modal-backdrop">
          <div className="tm-modal">
            <h2 className="tm-modal-title">
              {modalMode === "add" ? "Add Team members" : "Edit Team member"}
            </h2>
            <p className="tm-modal-subtitle">
              Talk with colleagues in a group chat. Messages in this group are
              only visible to its participants. New teammates may only be
              invited by the administrators.
            </p>

            <form className="tm-modal-form" onSubmit={handleSave}>
              <div className="tm-modal-field">
                <label>First name</label>
                <input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="tm-modal-field">
                <label>Last name</label>
                <input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="tm-modal-field">
                <label>Email ID</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                  disabled={modalMode === "edit"} // cannot change email
                />
              </div>

              <div className="tm-modal-field">
                <label>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+91 0000000000"
                />
              </div>

              <div className="tm-modal-field">
                <label>Designation</label>
                <div className="tm-select-input">
                  {/* Always member; only 1 admin in system */}
                  <span>Member</span>
                  <span className="tm-select-caret" />
                </div>
              </div>

              <div className="tm-modal-actions">
                <button
                  type="button"
                  className="tm-modal-btn tm-modal-btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="tm-modal-btn tm-modal-btn-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation panel */}
      {showDeleteConfirm && deletingUser && (
        <div className="tm-delete-panel">
          <div className="tm-delete-card">
            <p className="tm-delete-text">
              This teammate will be deleted and their tickets will be
              reassigned to the admin.
            </p>
            <div className="tm-delete-actions">
              <button
                className="tm-delete-btn tm-delete-btn-cancel"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingUser(null);
                }}
              >
                Cancel
              </button>
              <button
                className="tm-delete-btn tm-delete-btn-confirm"
                onClick={handleDeleteConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
