import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "shared";
import { useAuth } from "../features/auth/AuthContext.js";
import { Sprout, Eye, EyeOff, AlertCircle } from "lucide-react";
import { z } from "zod";

type LoginFormInputs = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Retrieve destination path or fallback to dashboard
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      setApiError(err.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2">
          <Sprout className="w-10 h-10 text-emerald-600" />
          <span className="font-extrabold text-2xl tracking-wide text-slate-900">AgriGuide</span>
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-slate-600">
          Or{" "}
          <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none focus:underline">
            create a new grower account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3" role="alert">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-red-800">{apiError}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                    errors.email ? "border-red-300 ring-1 ring-red-350" : "border-slate-350"
                  }`}
                  placeholder="name@example.com"
                  aria-invalid={errors.email ? "true" : "false"}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-emerald-605 hover:text-emerald-700 focus:outline-none">
                  Forgot Password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm pr-10 ${
                    errors.password ? "border-red-300 ring-1 ring-red-350" : "border-slate-350"
                  }`}
                  placeholder="••••••••"
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs font-semibold uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/api/auth/google";
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none transition-all"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="100%" height="100%">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.73 5.73 0 0 1 8.24 12.87a5.73 5.73 0 0 1 5.75-5.73c1.359 0 2.597.521 3.527 1.37l3.052-3.052A9.905 9.905 0 0 0 13.99 2 9.93 9.93 0 0 0 4 11.93a9.93 9.93 0 0 0 9.99 9.93c5.68 0 9.96-3.99 9.96-9.93 0-.67-.06-1.3-.18-1.645H12.24z"/>
                </svg>
                <span>Google</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
