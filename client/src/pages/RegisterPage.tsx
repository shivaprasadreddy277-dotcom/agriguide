import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "shared";
import { useAuth } from "../features/auth/AuthContext.js";
import { Sprout, Eye, EyeOff, AlertCircle } from "lucide-react";
import { z } from "zod";

// Extend shared registration schema with client-only validations
const clientRegisterSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Password confirmation is required"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must acknowledge the terms and responsible-use guidelines." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormInputs = z.infer<typeof clientRegisterSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(clientRegisterSchema),
    defaultValues: {
      preferredLanguage: "en",
      unitSystem: "metric",
    },
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      // Send only the server-side properties
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        preferredLanguage: data.preferredLanguage,
        unitSystem: data.unitSystem,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setApiError(err.message || "Registration failed. Please try again.");
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
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Create a grower account</h2>
        <p className="mt-2 text-sm text-slate-600">
          Or{" "}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none focus:underline">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3" role="alert">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-red-800">{apiError}</span>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                {...register("fullName")}
                className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                  errors.fullName ? "border-red-300 ring-1 ring-red-350" : "border-slate-350"
                }`}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                  errors.email ? "border-red-300 ring-1 ring-red-350" : "border-slate-350"
                }`}
                placeholder="farmer@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                  errors.confirmPassword ? "border-red-300 ring-1 ring-red-350" : "border-slate-350"
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Preferences Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="preferredLanguage" className="block text-sm font-semibold text-slate-700">
                  Preferred Language
                </label>
                <select
                  id="preferredLanguage"
                  {...register("preferredLanguage")}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
              </div>
              <div>
                <label htmlFor="unitSystem" className="block text-sm font-semibold text-slate-700">
                  Unit System
                </label>
                <select
                  id="unitSystem"
                  {...register("unitSystem")}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                >
                  <option value="metric">Metric (Hectares)</option>
                  <option value="imperial">Imperial (Acres)</option>
                </select>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  {...register("terms")}
                  className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-slate-350 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-slate-700">
                  Acknowledge Responsible Use Guidelines
                </label>
                <p className="text-slate-500 text-xs">
                  I acknowledge that AgriGuide AI advisory reports are general guidelines only and require expert agronomist or pathology laboratory verification.
                </p>
                {errors.terms && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.terms.message}</p>
                )}
              </div>
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
                  "Create Account"
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
export default RegisterPage;
