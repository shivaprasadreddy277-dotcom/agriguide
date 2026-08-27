import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext.js";
import {
  LayoutDashboard,
  Sprout,
  History,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Globe,
  Gauge
} from "lucide-react";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Farms", path: "/farms", icon: Sprout },
    { name: "Advisory History", path: "/advisories", icon: History },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Help", path: "/help", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar (visible on md+) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 min-h-screen border-r border-slate-800 shrink-0">
        <div className="p-5 flex items-center space-x-2 border-b border-slate-800">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl font-sans tracking-wide text-white block">AgriGuide</span>
            <span className="text-xs text-slate-400 font-sans block">AI Crop Advisory</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg uppercase select-none">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-white">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (visible on mobile only) */}
      <header className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-2">
          <Sprout className="w-6 h-6 text-emerald-500" />
          <span className="font-bold text-lg font-sans tracking-wide">AgriGuide</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Sidebar overlay menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex bg-slate-900/90 backdrop-blur-sm transition-opacity">
          <div className="w-64 bg-slate-900 h-full flex flex-col p-5 shadow-xl border-r border-slate-800">
            <div className="flex items-center justify-between pb-5 border-b border-slate-850">
              <span className="font-bold text-lg text-white">Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 py-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      location.pathname === item.path
                        ? "bg-emerald-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-5 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-950/20"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Mobile Bottom Navigation (farmers convenience on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-400 border-t border-slate-850 flex justify-around py-2 px-1 z-30 shadow-lg no-print">
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs transition-colors ${
                isActive ? "text-emerald-500 font-semibold" : "hover:text-slate-100"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        {/* Ask advice center quick link */}
        <Link
          to="/advisories/new"
          className="flex flex-col items-center py-1 px-3 text-emerald-500 hover:text-emerald-400 transition-transform hover:scale-105"
        >
          <PlusCircle className="w-7 h-7 text-emerald-500 fill-emerald-950/50" />
          <span className="text-[10px] font-bold mt-0.5 uppercase tracking-wide">Ask AI</span>
        </Link>
        {/* Settings & Profile */}
        <Link
          to="/settings"
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs transition-colors ${
            location.pathname === "/settings" ? "text-emerald-500 font-semibold" : "hover:text-slate-100"
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-16 md:pb-0">
        {/* Top Header - Desktop only */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200 px-8 py-4 shadow-sm z-10 no-print">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold font-sans text-slate-800">
              Welcome back, <span className="text-emerald-700">{user?.fullName}</span>
            </h1>
            {user?.preferredLanguage && (
              <span className="flex items-center space-x-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200">
                <Globe className="w-3.5 h-3.5" />
                <span>Language: {user.preferredLanguage === "hi" ? "Hindi (हिंदी)" : "English"}</span>
              </span>
            )}
            {user?.unitSystem && (
              <span className="flex items-center space-x-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200">
                <Gauge className="w-3.5 h-3.5" />
                <span>Units: {user.unitSystem === "imperial" ? "Imperial (Acre/Feet)" : "Metric (Hectare/Meter)"}</span>
              </span>
            )}
          </div>
          <Link
            to="/advisories/new"
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-750 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans tracking-wide text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ask for Advisory</span>
          </Link>
        </header>

        {/* Dynamic page contents wrapper */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
export default AppShell;
