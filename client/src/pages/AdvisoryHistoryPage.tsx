import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/apiClient.js";
import { queryClient } from "../lib/queryClient.js";
import {
  FileText,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  Sprout
} from "lucide-react";

export const AdvisoryHistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<any>("");
  const [sort, setSort] = useState<any>("newest");

  // Fetch paginated history list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["advisories", { page, search, category, status, sort }],
    queryFn: () =>
      api.advisories.list({
        page,
        pageSize: 10,
        search: search || undefined,
        category: category || undefined,
        status: status || undefined,
        sort,
      }),
  });

  const requests = data?.requests || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const retryMutation = useMutation({
    mutationFn: (id: string) => api.advisories.retry(id),
    onSuccess: () => {
      refetch();
    },
  });

  const categories = [
    { label: "All Categories", value: "" },
    { label: "Crop Selection", value: "crop_selection" },
    { label: "Land Preparation", value: "land_preparation" },
    { label: "Sowing & Planting", value: "sowing_planting" },
    { label: "Irrigation Scheduling", value: "irrigation" },
    { label: "Soil & Nutrition", value: "soil_nutrition" },
    { label: "Pest & Disease Triage", value: "pest_disease" },
    { label: "Weed Management", value: "weed_management" },
    { label: "Weather Stress", value: "weather_stress" },
    { label: "Harvest Readiness", value: "harvest" },
    { label: "Post-Harvest Handling", value: "post_harvest" },
  ];

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleFilterChange = () => {
    setPage(1); // reset to page 1 on filter changes
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Advisory History</h2>
          <p className="text-sm text-slate-500">Track and review previous AI recommendations and timelines.</p>
        </div>
        <Link
          to="/advisories/new"
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm tracking-wide"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Advisory</span>
        </Link>
      </div>

      {/* Filter Bar Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Search crop or question */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleFilterChange();
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm placeholder-slate-400"
              placeholder="Search crop or question..."
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              handleFilterChange();
            }}
            className="block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              handleFilterChange();
            }}
            className="block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="generating">Generating</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              handleFilterChange();
            }}
            className="block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Advisory list contents */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-20 animate-pulse"></div>
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
          {requests.map((req: any) => (
            <div key={req.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="space-y-1.5 pr-4">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800 text-sm">{req.cropName}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border border-slate-200">
                    {req.category.replace("_", " ")}
                  </span>
                </div>
                <p className="text-slate-600 text-sm max-w-[500px] leading-relaxed line-clamp-2">
                  {req.question}
                </p>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Requested on {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center space-x-4 shrink-0">
                {/* Status indicator */}
                {req.status === "completed" && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wide flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Report Ready</span>
                  </span>
                )}
                {req.status === "generating" && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-wide animate-pulse">
                    Analyzing
                  </span>
                )}
                {req.status === "failed" && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 uppercase tracking-wide flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Failed</span>
                    </span>
                    {req.generationAttempts < 3 && (
                      <button
                        onClick={() => retryMutation.mutate(req.id)}
                        disabled={retryMutation.isPending}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
                {req.status === "queued" && (
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wide">
                    Queued
                  </span>
                )}

                <Link
                  to={`/advisories/${req.id}`}
                  className="bg-slate-100 hover:bg-slate-250 text-slate-700 hover:text-slate-900 font-bold text-xs px-4 py-2 rounded-lg transition-colors border"
                >
                  View Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="bg-slate-50 p-6 rounded-full border border-slate-200/50 inline-block text-slate-400">
            <FileText className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-800">No Historical Records Found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              No advisory request matches the selected search filters or categories.
            </p>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-sm font-semibold">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="flex items-center space-x-1.5 text-slate-655 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
            <span>Previous</span>
          </button>
          <span className="text-slate-500 font-medium">
            Page {page} of {totalPages} ({total} reports)
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="flex items-center space-x-1.5 text-slate-655 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      )}
    </div>
  );
};
export default AdvisoryHistoryPage;
