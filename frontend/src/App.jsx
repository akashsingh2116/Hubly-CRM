import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
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

const Contacts  = lazy(() => import("./pages/Contacts"));
const Companies = lazy(() => import("./pages/Companies"));
const Pipeline  = lazy(() => import("./pages/Pipeline"));
const Tasks     = lazy(() => import("./pages/Tasks"));

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="contact-center" element={<ContactCenter />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="chatbot" element={<ChatBot />} />
          <Route path="team-management" element={<TeamManagement />} />
          <Route path="setting" element={<Setting />} />
          <Route path="contacts" element={<Suspense fallback={<div className="crm-loading">Loading…</div>}><Contacts /></Suspense>} />
          <Route path="companies" element={<Suspense fallback={<div className="crm-loading">Loading…</div>}><Companies /></Suspense>} />
          <Route path="pipeline" element={<Suspense fallback={<div className="crm-loading">Loading…</div>}><Pipeline /></Suspense>} />
          <Route path="tasks" element={<Suspense fallback={<div className="crm-loading">Loading…</div>}><Tasks /></Suspense>} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
