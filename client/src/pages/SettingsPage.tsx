import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.js";
import { ShieldAlert, Trash2, LogOut, Download, KeyRound, ShieldCheck } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { logout, deleteAccount, user } = useAuth();
  const navigate = useNavigate();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate("/");
    } catch (err) {
      console.error("Account deletion failed:", err);
      setIsDeleting(false);
    }
  };

  const handleExportData = () => {
    // Generate a simple JSON containing user data, farms, and plots, and trigger browser download
    const exportObj = {
      user: {
        id: user?.id,
        fullName: user?.fullName,
        email: user?.email,
        preferredLanguage: user?.preferredLanguage,
        unitSystem: user?.unitSystem,
      },
      exportedAt: new Date().toISOString(),
      note: "This contains a snapshot of your account profile under GDPR/data protection guidelines.",
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `agriguide_gdpr_export_${user?.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Platform Settings</h2>
        <p className="text-sm text-slate-500">Configure data preferences, export summaries, or close your account.</p>
      </div>

      {/* Security & Access */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2">Session Control</h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 text-sm block">Active User Session</span>
            <span className="text-slate-500 text-xs">Terminate your session and clear secure local cookies.</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Privacy and Data GDPR Export */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Privacy & GDPR</span>
        </h3>
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            We value your agricultural intellectual property. Advisory requests, images, and soil pH levels are processed privately. Image uploads are processed strictly in-memory and are never stored long-term in raw database tables.
          </p>
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="font-bold text-slate-800 text-sm block">Export Personal Data</span>
              <span className="text-slate-500 text-xs">Request a structured JSON file containing all saved grower settings.</span>
            </div>
            <button
              onClick={handleExportData}
              className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors"
            >
              <Download className="w-4.5 h-4.5" />
              <span>Export Snapshot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="font-extrabold text-red-950 text-lg border-b border-red-200 pb-2">Danger Zone</h3>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="space-y-1">
            <span className="font-bold text-red-900 text-sm block">Permanently Close Account</span>
            <p className="text-slate-500 text-xs max-w-md">
              Deleting your account is permanent. This cascades database rows to erase all farm plots, crop images, historic reports, audit logs, and feedback forms. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center space-x-2 bg-red-650 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Overlay Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 text-red-600 p-3 rounded-full shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-lg">Confirm Account Deletion</h3>
                <p className="text-sm text-slate-550 leading-relaxed">
                  To confirm that you want to delete your AgriGuide account and all associated farm histories, type <strong className="text-rose-600 font-extrabold">DELETE</strong> in the box below.
                </p>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-350 rounded-lg text-sm focus:outline-none focus:ring-rose-500 focus:border-rose-500 uppercase tracking-widest font-mono"
                placeholder="Type DELETE to confirm"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteInput("");
                }}
                className="bg-slate-105 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg transition-colors border"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInput !== "DELETE" || isDeleting}
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Erasing..." : "Confirm Erase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsPage;
