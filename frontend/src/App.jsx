import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import ContactCenter from "./pages/ContactCenter";
import Analytics from "./pages/Analytics";
import ChatBot from "./pages/ChatBot";
import TeamManagement from "./pages/TeamManagement";
import Setting from "./pages/Setting";

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
       <Route path="/signup" element={<SignupPage />} />

      {/* Dashboard (all admin pages) */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="contact-center" element={<ContactCenter />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="chatbot" element={<ChatBot />} />
        <Route path="team-management" element={<TeamManagement />} />
        <Route path="setting" element={<Setting />} />
      </Route>
    </Routes>
  );
}
