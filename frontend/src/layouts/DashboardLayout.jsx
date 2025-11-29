import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import vectorLogo from "../assets/vector.png";
import dashboardIcon from "../assets/dashboard.png";
import contactIcon from "../assets/contactcenter.png";
import analyticsIcon from "../assets/analytics.png";
import chatbotIcon from "../assets/chatbot.png";
import teamIcon from "../assets/team.png";
import settingsIcon from "../assets/setting.png";

export default function DashboardLayout() {
  const navItems = [
    {
      to: "/dashboard",
      key: "dashboard",
      label: "Dashboard",
      icon: dashboardIcon,
    },
    {
      to: "/dashboard/contact-center",
      key: "chat",
      label: "Contact Center",
      icon: contactIcon,
    },
    {
      to: "/dashboard/analytics",
      key: "analytics",
      label: "Analytics",
      icon: analyticsIcon,
    },
    {
      to: "/dashboard/chatbot",
      key: "chatbot",
      label: "Chat Bot",
      icon: chatbotIcon,
    },
    {
      to: "/dashboard/team-management",
      key: "team",
      label: "Team",
      icon: teamIcon,
    },
    {
      to: "/dashboard/setting",
      key: "settings",
      label: "Settings",
      icon: settingsIcon,
    },
  ];

  return (
    <div className="dash-root">
      {/* LEFT SIDEBAR */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <div className="dash-sidebar-logo">
            <img
              src={vectorLogo}
              alt="Hubly Logo"
              className="dash-vector-logo"
            />
          </div>

          <nav className="dash-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  "dash-nav-link" + (isActive ? " active" : "")
                }
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="dash-nav-icon-img"
                />
                <span className="dash-nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="dash-sidebar-bottom">
          <div className="dash-user-avatar" />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dash-main">
        <div className="dash-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
