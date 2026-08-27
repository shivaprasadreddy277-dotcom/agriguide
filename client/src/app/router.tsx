import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthGuard from "../components/auth/AuthGuard.js";
import AppShell from "../components/layout/AppShell.js";

// Page imports
import LandingPage from "../pages/LandingPage.js";
import LoginPage from "../pages/LoginPage.js";
import RegisterPage from "../pages/RegisterPage.js";
import DashboardPage from "../pages/DashboardPage.js";
import FarmsPage from "../pages/FarmsPage.js";
import FarmDetailPage from "../pages/FarmDetailPage.js";
import NewAdvisoryPage from "../pages/NewAdvisoryPage.js";
import AdvisoryDetailPage from "../pages/AdvisoryDetailPage.js";
import AdvisoryHistoryPage from "../pages/AdvisoryHistoryPage.js";
import ProfilePage from "../pages/ProfilePage.js";
import SettingsPage from "../pages/SettingsPage.js";
import HelpPage from "../pages/HelpPage.js";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.js";
import ResetPasswordPage from "../pages/ResetPasswordPage.js";

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </AuthGuard>
          }
        />
        <Route
          path="/farms"
          element={
            <AuthGuard>
              <AppShell>
                <FarmsPage />
              </AppShell>
            </AuthGuard>
          }
        />
        <Route
          path="/farms/:farmId"
          element={
            <AuthGuard>
              <AppShell>
                <FarmDetailPage />
              </AppShell>
            </AuthGuard>
          }
        />
        <Route
          path="/advisories/new"
          element={
            <AuthGuard>
              <AppShell>
                <NewAdvisoryPage />
              </AppShell>
            </AuthGuard>
          }
        />
        <Route
          path="/advisories/:advisoryId"
          element={
            <AuthGuard>
              <AppShell>
                <AdvisoryDetailPage />
              </AppShell>
            </AuthGuard>
          }
        />
        <Route
          path="/advisories"
          element={
            <AuthGuard>
              <AppShell>
                <AdvisoryHistoryPage />
              </AppShell>
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <AppShell>
                <ProfilePage />
              </AppShell>
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <AppShell>
                <SettingsPage />
              </AppShell>
            </AuthGuard>
          }
        />
        <Route
          path="/help"
          element={
            <AuthGuard>
              <AppShell>
                <HelpPage />
              </AppShell>
            </AuthGuard>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
