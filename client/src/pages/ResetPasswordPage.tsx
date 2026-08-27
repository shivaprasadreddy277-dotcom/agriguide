import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "shared";
import { api } from "../lib/apiClient.js";
import { Sprout, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { z } from "zod";

const clientResetSchema = resetPasswordSchema
  .extend({
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetFormInputs = z.infer<typeof clientResetSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormInputs>({
    resolver: zodResolver(clientResetSchema),
    defaultValues: {
      token,
    },
  });

  const onSubmit = async (data: ResetFormInputs) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await api.auth.resetPassword({
        token: data.token,
        password: data.password,
      });
      setShowSuccess(true);
    } catch (err: any) {
      setApiError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900">Missing Reset Token</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            This password reset page requires a valid query token link. Check your email or console logs.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2">
          <Sprout className="w-10 h-10 text-emerald-600" />
          <span className="font-extrabold text-2xl tracking-wide text-slate-900">AgriGuide</span>
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900 font-sans">Update Password</h2>
        <p className="mt-2 text-sm text-slate-655 font-medium">
          Create a new password to restore access to your grower account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
          {showSuccess ? (
            <div className="space-y-5 text-center">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-250 flex items-start space-x-3 text-left">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm block">Password changed successfully</span>
                  <span className="text-xs text-emerald-900">
                    Your password has been securely updated. You can now login with your new credentials.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm"
                >
                  <span>Sign In Now</span>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3" role="alert">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-red-800">{apiError}</span>
                </div>
              )}

              {/* Hidden token field */}
              <input type="hidden" {...register("token")} />

              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  New Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm pr-10 ${
                      errors.password ? "border-red-300 ring-1 ring-red-350" : "border-slate-350"
                    }`}
                    placeholder="•••••••• (min 8 chars, 1 letter, 1 number)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                  Confirm Password *
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                      errors.confirmPassword ? "border-red-300 ring-1 ring-red-350" : "border-slate-350"
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default ResetPasswordPage;
