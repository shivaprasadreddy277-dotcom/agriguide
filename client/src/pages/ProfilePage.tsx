import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileUpdateSchema } from "shared";
import { useAuth } from "../features/auth/AuthContext.js";
import { User, CheckCircle, Globe, Gauge, AlertCircle } from "lucide-react";
import { z } from "zod";

type ProfileFormInputs = z.infer<typeof profileUpdateSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      preferredLanguage: user?.preferredLanguage || "en",
      unitSystem: user?.unitSystem || "metric",
    },
  });

  const onSubmit = async (data: ProfileFormInputs) => {
    setApiError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await updateProfile(data);
      setSuccessMsg("Grower profile updated successfully.");
    } catch (err: any) {
      setApiError(err.message || "Failed to update profile settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">My Profile</h2>
        <p className="text-sm text-slate-500">Manage your grower information and localization settings.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <span className="text-sm font-semibold text-red-800">{apiError}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-sm font-semibold text-emerald-800">{successMsg}</span>
            </div>
          )}

          <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl uppercase">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{user?.fullName}</h3>
              <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                {...register("fullName")}
                className="mt-1 block w-full px-3 py-2.5 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Grower name"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email (Read Only) */}
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 text-slate-450">
                Email Address (Read-only)
              </label>
              <input
                id="email"
                type="email"
                value={user?.email}
                disabled
                className="mt-1 block w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed"
              />
            </div>

            {/* Language */}
            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-semibold text-slate-700">
                Advisory Output Language *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <select
                  id="preferredLanguage"
                  {...register("preferredLanguage")}
                  className="block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
              </div>
            </div>

            {/* Unit System */}
            <div>
              <label htmlFor="unitSystem" className="block text-sm font-semibold text-slate-700">
                Preferred Unit System *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <select
                  id="unitSystem"
                  {...register("unitSystem")}
                  className="block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                >
                  <option value="metric">Metric (Hectares, Meters)</option>
                  <option value="imperial">Imperial (Acres, Feet)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-lg shadow-md transition-all uppercase tracking-wider flex items-center space-x-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Save Profile Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProfilePage;
