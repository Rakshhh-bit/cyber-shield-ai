import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 🔥 ADD THIS IMPORT
import Alert from "./components/Alert";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EmailScan from "./pages/EmailScan";
import LinkScan from "./pages/LinkScan";
import MessageScan from "./pages/MessageScan";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Router>

      {/* 🔥 GLOBAL ALERT (works on all pages) */}
      <Alert />

      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/email" element={<EmailScan />} />
        <Route path="/link" element={<LinkScan />} />
        <Route path="/message" element={<MessageScan />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
      </Routes>

    </Router>
  );
}

export default App;
