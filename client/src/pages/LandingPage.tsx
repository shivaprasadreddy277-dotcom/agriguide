import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.js";
import { Sprout, ShieldAlert, ArrowRight, CheckCircle2, CloudRain, ShieldCheck, Microscope } from "lucide-react";

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  // If already logged in, redirect straight to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      title: "Disease Triage",
      desc: "Upload pictures of leaf symptoms to receive indicational disease options and checks.",
      icon: Microscope,
    },
    {
      title: "Irrigation Scheduling",
      desc: "Optimize water applications based on crops growth stage, soil type, and weather conditions.",
      icon: CloudRain,
    },
    {
      title: "Soil & Nutrient Management",
      desc: "Input soil test logs to coordinate conservative nitrogen, phosphorus, and potassium guides.",
      icon: Sprout,
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Map Farm Plots",
      desc: "Register your farms, soil profiles, and crop plots in less than two minutes.",
    },
    {
      step: "2",
      title: "Submit a Query",
      desc: "Complete the guided form with crop stage details and upload up to three detail pictures.",
    },
    {
      step: "3",
      title: "Get Structured Advice",
      desc: "Review immediate actions, timeframe-based guides, safety warnings, and expert pointers.",
    },
  ];

  const categories = [
    "Crop Selection", "Land Preparation", "Irrigation Guide", "Nutrient Deficiencies", 
    "Sowing practices", "Pest & Disease Triage", "Weed Management", "Harvest Readiness"
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sprout className="w-8 h-8 text-emerald-600" />
            <span className="font-extrabold text-2xl font-sans tracking-wide text-slate-900">AgriGuide</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-slate-600 hover:text-emerald-700 font-semibold text-sm px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-md"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-emerald-600 hover:bg-emerald-750 text-white font-semibold text-sm px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-16 md:py-24 px-4 border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AI Agricultural Assistant</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 font-sans leading-tight">
            Grow Smarter with <span className="text-emerald-700">Precision AI Advisory</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Get clear, actionable, and conservative crop management recommendations. Map your fields, upload crop images, and optimize harvests safely.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-750 text-white font-bold px-8 py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 font-semibold px-8 py-3.5 rounded-lg border border-slate-350 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 text-base"
            >
              Access Platform
            </Link>
          </div>
        </div>
      </section>

      {/* Safety Notice Block */}
      <section className="bg-amber-50/50 border-b border-amber-200 py-8 px-4">
        <div className="max-w-4xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-5">
          <div className="bg-amber-100 p-3 rounded-full text-amber-800 shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-bold text-amber-900 text-lg">AI Crop Advisory Limitation Notice</h2>
            <p className="text-sm text-amber-800 leading-relaxed font-medium">
              AgriGuide provides general, cautious observations and management timelines. Suggestions are indicative and should never replace qualified extension services, pathologists, soil laboratories, or legally certified pesticide advisors. Seek local expert confirmation before applying chemical controls.
            </p>
          </div>
        </div>
      </section>

      {/* How it works workflow */}
      <section className="py-16 px-4 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 font-sans">Three-Step Advisory Workflow</h2>
            <p className="text-slate-600 text-md max-w-lg mx-auto">
              Get detailed recommendations designed to help you act quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, idx) => (
              <div key={idx} className="relative bg-slate-50 border border-slate-250/50 p-6 rounded-2xl space-y-4">
                <div className="absolute -top-5 left-6 bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 text-xl pt-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Focus */}
      <section className="py-16 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 font-sans">Advisory Modules</h2>
            <p className="text-slate-600 text-md max-w-lg mx-auto">
              Built on verified agronomic parameters and Google Gemini's advanced reasoning models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-xl inline-block">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="py-16 px-4 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 font-sans">Supported Advisory Categories</h2>
            <p className="text-slate-600 text-md max-w-lg mx-auto">
              AgriGuide supports a wide list of crop cycles and farm priorities.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories.map((c, idx) => (
              <div key={idx} className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium text-slate-800 text-sm">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Sprout className="w-6 h-6 text-emerald-500" />
            <span className="font-bold text-white text-lg">AgriGuide</span>
          </div>
          <p className="text-xs text-center md:text-right leading-relaxed max-w-md">
            &copy; {new Date().getFullYear()} AgriGuide Platform. Designed under strict guidelines for responsible agricultural AI assistance. All advice requires local agronomist validation.
          </p>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
