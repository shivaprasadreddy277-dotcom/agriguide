import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient.js";
import { useAuth } from "../features/auth/AuthContext.js";
import {
  Sprout,
  PlusCircle,
  ShieldCheck,
  LayoutDashboard,
  Sprout as FarmIcon,
  Layers,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Droplet,
  Microscope,
  Leaf
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Queries for farms and advisories
  const { data: farms = [], isLoading: isLoadingFarms } = useQuery({
    queryKey: ["farms"],
    queryFn: api.farms.list,
  });

  const { data: advisoriesData, isLoading: isLoadingAdvisories } = useQuery({
    queryKey: ["advisories", { page: 1, pageSize: 5 }],
    queryFn: () => api.advisories.list({ page: 1, pageSize: 5 }),
  });

  const defaultFarm = farms.find((f: any) => f.isDefault) || farms[0] || null;
  const totalFarms = farms.length;
  
  // Calculate total fields (needs fields queried or mock calculated from farms - since we check farms in details we can estimate or count)
  // Let's show the default farm and its general data
  const totalAdvisories = advisoriesData?.total || 0;
  const recentAdvisories = advisoriesData?.requests || [];

  const quickCategories = [
    { name: "Pest & Disease", category: "pest_disease", icon: Microscope, color: "text-red-600 bg-red-50 border-red-200" },
    { name: "Irrigation Schedule", category: "irrigation", icon: Droplet, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { name: "Nutrient Deficiencies", category: "soil_nutrition", icon: Sprout, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { name: "General Crop Plan", category: "crop_selection", icon: Leaf, color: "text-emerald-600 bg-emerald-50 border-emerald-250" },
  ];

  const isLoading = isLoadingFarms || isLoadingAdvisories;

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
        <div className="space-y-2 z-10">
          <p className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest">Grower Dashboard</p>
          <h2 className="text-3xl font-extrabold font-sans">Hello, {user?.fullName} 👋</h2>
          <p className="text-slate-350 text-sm max-w-xl">
            Keep track of your field conditions, generate AI crop plans, and resolve leaf anomalies with real-time advisor tools.
          </p>
        </div>
        <Link
          to="/advisories/new"
          className="z-10 flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-md transition-all font-sans text-sm tracking-wide uppercase shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Ask AgriGuide</span>
        </Link>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Sprout className="w-64 h-64 text-emerald-300" />
        </div>
      </div>

      {/* Responsible Use Banner */}
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="font-bold text-emerald-950">Responsible AI Reminder:</span>{" "}
          <span className="text-emerald-900">
            AgriGuide crop suggestions are conservative and indicative. Always cross-reference AI observations with qualified agronomists, extension officers, or local regulatory bodies before chemical applications.
          </span>
        </div>
      </div>

      {/* Stats Summary Widgets */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-28 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Farms Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium text-sm">Farms Tracked</span>
              <p className="text-3xl font-extrabold text-slate-900">{totalFarms}</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-xl text-slate-700">
              <FarmIcon className="w-6 h-6" />
            </div>
          </div>

          {/* Active Plots Info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium text-sm">Default Farm Profile</span>
              <p className="text-xl font-bold text-slate-900 truncate max-w-[200px]">
                {defaultFarm ? defaultFarm.name : "None registered"}
              </p>
            </div>
            <div className="bg-slate-100 p-4 rounded-xl text-slate-700">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* Reports Generated */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium text-sm">Advisory Reports</span>
              <p className="text-3xl font-extrabold text-slate-900">{totalAdvisories}</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-xl text-slate-700">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Categories & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Default Farm Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick AI Requests */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-lg">Quick Ask AI Categories</h3>
            <div className="grid grid-cols-1 gap-3">
              {quickCategories.map((c, idx) => {
                const Icon = c.icon;
                return (
                  <Link
                    key={idx}
                    to={`/advisories/new?category=${c.category}`}
                    className={`flex items-center justify-between p-3.5 border rounded-xl hover:shadow-sm transition-all group ${c.color}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="font-semibold text-sm">{c.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Default Farm Summary Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-lg">Farm Overview</h3>
              <Link to="/farms" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                Manage Farms
              </Link>
            </div>
            {defaultFarm ? (
              <div className="space-y-3 text-sm">
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs font-medium block">Name</span>
                  <span className="text-slate-800 font-semibold">{defaultFarm.name}</span>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs font-medium block">Location</span>
                  <span className="text-slate-800 font-semibold">
                    {defaultFarm.locality ? `${defaultFarm.locality}, ` : ""}
                    {defaultFarm.stateProvince || defaultFarm.country}
                  </span>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs font-medium block">Total Area</span>
                  <span className="text-slate-800 font-semibold">
                    {defaultFarm.totalArea ? `${defaultFarm.totalArea} ${defaultFarm.areaUnit}` : "Not recorded"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-medium block">Soil Profile</span>
                  <span className="text-slate-800 font-semibold">{defaultFarm.soilType || "Not recorded"}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-slate-500">You haven't added any farms yet.</p>
                <Link
                  to="/farms"
                  className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3.5 py-2 rounded-lg border border-emerald-250 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Farm</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Advisories */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 min-h-[350px] flex flex-col">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-lg">Recent Advisory Requests</h3>
              <Link to="/advisories" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                View History
              </Link>
            </div>

            {isLoading ? (
              <div className="flex-1 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : recentAdvisories.length > 0 ? (
              <div className="flex-1 divide-y divide-slate-100">
                {recentAdvisories.map((adv: any) => (
                  <div key={adv.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 text-sm">{adv.cropName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border border-slate-200">
                          {adv.category.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs truncate max-w-[300px] md:max-w-[450px]">
                        {adv.question}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Submitted on {new Date(adv.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Status Badges */}
                      {adv.status === "completed" && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wide">
                          Ready
                        </span>
                      )}
                      {adv.status === "generating" && (
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-wide animate-pulse">
                          Generating
                        </span>
                      )}
                      {adv.status === "failed" && (
                        <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 uppercase tracking-wide">
                          Failed
                        </span>
                      )}
                      {adv.status === "queued" && (
                        <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wide">
                          Queued
                        </span>
                      )}

                      <Link
                        to={`/advisories/${adv.id}`}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-2 py-1"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-4">
                <div className="bg-slate-50 p-6 rounded-full border border-slate-200/50">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">No Advisory Reports Yet</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Submit crop details, environment parameters, and questions to generate structured advisory schedules.
                  </p>
                </div>
                <Link
                  to="/advisories/new"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow transition-all uppercase tracking-wide"
                >
                  Create Request
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
