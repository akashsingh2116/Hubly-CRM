import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../apiClient";
import GlobalSearch from "../components/GlobalSearch";
import NotificationBell from "../components/NotificationBell";
import { useSocket } from "../hooks/useSocket";
import "../styles/crm.css";

const NAV = [
  { to: "/dashboard",                end: true,  icon: "⊞",  label: "Dashboard" },
  { to: "/dashboard/contact-center", end: false, icon: "💬", label: "Live Chats" },
  { to: "/dashboard/contacts",       end: false, icon: "👥", label: "Contacts" },
  { to: "/dashboard/companies",      end: false, icon: "🏢", label: "Companies" },
  { to: "/dashboard/pipeline",       end: false, icon: "📊", label: "Pipeline" },
  { to: "/dashboard/tasks",          end: false, icon: "✅", label: "Tasks" },
  { to: "/dashboard/analytics",      end: false, icon: "📈", label: "Analytics" },
  { to: "/dashboard/chatbot",        end: false, icon: "🤖", label: "Chatbot" },
  { to: "/dashboard/team-management",end: false, icon: "👤", label: "Team" },
  { to: "/dashboard/setting",        end: false, icon: "⚙️", label: "Settings" },
];

export default function DashboardLayout() {
  const user     = getCurrentUser();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [collapsed, setCollapsed] = useState(false);
  const { socketRef } = useSocket({ withAuth: true });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user
    ? `${(user.firstName || "")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase()
    : "?";

  return (
    <div className={`dl-root${collapsed ? " dl-root--collapsed" : ""}`}>
      {/* SIDEBAR */}
      <aside className="dl-sidebar">
        <div className="dl-sidebar__brand">
          <div className="dl-brand-icon">H</div>
          {!collapsed && <span className="dl-brand-name">Hubly</span>}
          <button className="dl-collapse-btn" onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        <nav className="dl-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `dl-nav__link${isActive ? " dl-nav__link--active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="dl-nav__icon">{item.icon}</span>
              {!collapsed && <span className="dl-nav__label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="dl-sidebar__footer">
          {!collapsed && user && (
            <div className="dl-user">
              <div className="dl-user__avatar">{initials}</div>
              <div className="dl-user__info">
                <div className="dl-user__name">{user.firstName} {user.lastName}</div>
                <div className="dl-user__role">{user.role}</div>
              </div>
            </div>
          )}
          <button className="dl-logout-btn" onClick={handleLogout} title="Logout">
            {collapsed ? "↩" : "↩ Logout"}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="dl-main">
        {/* TOPBAR */}
        <header className="dl-topbar">
          <div className="dl-topbar__left">
            <GlobalSearch />
          </div>
          <div className="dl-topbar__right">
            <NotificationBell socketRef={socketRef} />
            <button
              className="dl-theme-btn"
              onClick={() => setDark((d) => !d)}
              title={dark ? "Switch to light" : "Switch to dark"}
            >
              {dark ? "☀️" : "🌙"}
            </button>
            <div className="dl-topbar__avatar" title={user?.email}>{initials}</div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="dl-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
