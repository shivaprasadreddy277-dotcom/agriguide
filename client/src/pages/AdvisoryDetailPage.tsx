import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackSchema } from "shared";
import { api, ApiError } from "../lib/apiClient.js";
import { queryClient } from "../lib/queryClient.js";
import {
  ArrowLeft,
  Printer,
  ThumbsUp,
  ThumbsDown,
  Star,
  ShieldAlert,
  Clock,
  CheckCircle,
  AlertTriangle,
  Microscope,
  Info,
  Layers,
  Sprout,
  Trash2,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { z } from "zod";

type FeedbackFormInputs = z.infer<typeof feedbackSchema>;

export const AdvisoryDetailPage: React.FC = () => {
  const { advisoryId } = useParams<{ advisoryId: string }>();
  const navigate = useNavigate();

  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [retryPolling, setRetryPolling] = useState(false);

  // Queries
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["advisory", advisoryId],
    queryFn: () => api.advisories.get(advisoryId!),
    enabled: !!advisoryId,
    // Poll if status is generating or queued
    refetchInterval: (query) => {
      const status = query.state.data?.request?.status;
      return status === "generating" || status === "queued" ? 2000 : false;
    },
  });

  const request = data?.request;
  const report = data?.report;
  const metadata = data?.metadata;

  // Feedback Query
  const { data: feedbackData } = useQuery({
    queryKey: ["feedback", report?.id],
    queryFn: () => api.advisories.getFeedback(report.id),
    enabled: !!report?.id,
  });

  // Mutations
  const feedbackMutation = useMutation({
    mutationFn: (vals: FeedbackFormInputs) => api.advisories.submitFeedback(request.reportId, vals),
    onSuccess: () => {
      setFeedbackSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["feedback", report?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.advisories.delete(advisoryId!),
    onSuccess: () => {
      navigate("/advisories");
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => api.advisories.retry(advisoryId!),
    onSuccess: () => {
      refetch();
    },
  });

  // Forms Hook
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FeedbackFormInputs>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      helpful: true,
      rating: 5,
      comment: "",
    },
  });

  // Load existing feedback if present
  useEffect(() => {
    if (feedbackData) {
      setValue("helpful", feedbackData.helpful);
      setValue("rating", feedbackData.rating || 5);
      setValue("comment", feedbackData.comment || "");
      setFeedbackSubmitted(true);
    }
  }, [feedbackData, setValue]);

  const watchedHelpful = watch("helpful");
  const watchedRating = watch("rating");

  const onSubmitFeedback = (vals: FeedbackFormInputs) => {
    feedbackMutation.mutate(vals);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-white border border-slate-200 rounded-2xl"></div>
        <div className="h-96 bg-white border border-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Advisory Report Not Found</h3>
        <p className="text-slate-500 text-sm">The advisory request you look for does not exist or has been deleted.</p>
        <Link to="/advisories" className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700">
          Back to History
        </Link>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Renderer 1: Crop Selection
  // -------------------------------------------------------------
  const renderCropSelection = (rep: any) => {
    return (
      <div className="space-y-6">
        {/* Recommended Crops Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2">Recommended Crop Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rep.recommended_options.map((opt: any, idx: number) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/35 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-800 text-lg">{opt.crop_name}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-250 font-bold px-2 py-0.5 rounded-md uppercase">
                    Option {idx + 1}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{opt.why_it_may_fit}</p>
                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 font-semibold">Water Need:</span>{" "}
                    <span className="text-slate-800 font-bold">{opt.water_requirement}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Soil Match:</span>{" "}
                    <span className="text-slate-800 font-bold">{opt.soil_compatibility}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Main Risks:</span>{" "}
                    <span className="text-slate-800 font-bold">{opt.main_risks}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Crop Rotation:</span>{" "}
                    <span className="text-slate-800 font-bold">{opt.rotation_considerations}</span>
                  </div>
                  <div className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200 mt-2 font-medium">
                    <span className="font-bold block text-[10px] uppercase text-amber-800 mb-0.5">Pre-decision Check:</span>
                    {opt.information_required_before_deciding}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Factors & Constraints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-base">Key Comparison Factors</h4>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              {rep.comparison_factors.map((f: string, idx: number) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-base">Identified Constraints</h4>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              {rep.constraints.map((c: string, idx: number) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h4 className="font-bold text-slate-900 text-base">Recommended Next Steps</h4>
          <ol className="list-decimal list-inside text-sm text-slate-650 space-y-1.5 font-semibold">
            {rep.next_steps.map((step: string, idx: number) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // Renderer 2: Pest & Disease Triage
  // -------------------------------------------------------------
  const renderPestDisease = (rep: any) => {
    return (
      <div className="space-y-6">
        {/* Plausible Causes Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2">Plausible Diagnoses / Interpretations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rep.possible_causes.map((cause: any, idx: number) => (
              <div key={idx} className="border border-slate-250 rounded-xl p-5 space-y-3 bg-slate-50/30">
                <div>
                  <span className="font-bold text-slate-950 text-base block">{cause.name}</span>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 uppercase border ${
                    cause.likelihood === "more_likely"
                      ? "bg-red-50 text-red-800 border-red-200"
                      : cause.likelihood === "plausible"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-250"
                  }`}>
                    {cause.likelihood.replace("_", " ")}
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">{cause.reasoning}</p>
                <div className="bg-slate-100 text-slate-800 p-3 rounded-lg border border-slate-250 text-xs">
                  <span className="font-semibold block text-[10px] text-slate-500 uppercase mb-0.5">How to verify:</span>
                  {cause.how_to_check}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Immediate Non-Chemical Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h4 className="font-bold text-slate-900 text-base">Immediate Non-Chemical Actions (Cultural/IPM)</h4>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5">
            {rep.immediate_nonchemical_actions.map((act: string, idx: number) => (
              <li key={idx} className="leading-relaxed">{act}</li>
            ))}
          </ul>
        </div>

        {/* Field Checks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-base">Recommended Field Inspections</h4>
            <ul className="list-disc list-inside text-sm text-slate-655 space-y-1">
              {rep.field_checks.map((chk: string, idx: number) => (
                <li key={idx}>{chk}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-base">When to seek expert extension help</h4>
            <ul className="list-disc list-inside text-sm text-slate-655 space-y-1">
              {rep.when_to_seek_help.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Chemical Safety block */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm space-y-2">
          <h4 className="font-bold text-red-900 text-base flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5" />
            <span>Chemical & Pesticide Application Safety</span>
          </h4>
          <p className="text-red-800 text-sm leading-relaxed font-semibold">
            {rep.chemical_safety}
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // Renderer 3: General Advisory
  // -------------------------------------------------------------
  const renderGeneralAdvisory = (rep: any) => {
    return (
      <div className="space-y-6">
        {/* Top 3 Immediate Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2">Top Three Prioritized Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rep.immediate_actions.map((act: any, idx: number) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-5 space-y-2 bg-slate-50/40 relative">
                <span className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  act.priority === "urgent"
                    ? "bg-red-100 text-red-800 border-red-250 animate-pulse"
                    : act.priority === "high"
                    ? "bg-amber-100 text-amber-800 border-amber-250"
                    : "bg-slate-100 text-slate-700 border-slate-250"
                }`}>
                  {act.priority}
                </span>
                <span className="text-slate-400 font-extrabold text-sm block">ACTION {idx + 1}</span>
                <p className="font-bold text-slate-900 text-sm pr-16">{act.action}</p>
                <p className="text-slate-550 text-xs leading-relaxed">{act.reason}</p>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2 border-t mt-3 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timeframe: {act.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Management Plan Timeline */}
        {rep.management_plan && rep.management_plan.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2">Management Timeline</h3>
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
              {rep.management_plan.map((plan: any, idx: number) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1 bg-white border-2 border-emerald-600 rounded-full w-4.5 h-4.5"></div>
                  <div className="space-y-2">
                    <span className="font-bold text-emerald-800 text-sm block uppercase tracking-wide">
                      {plan.timeframe}
                    </span>
                    <ul className="list-disc list-inside text-sm text-slate-655 space-y-1">
                      {plan.actions.map((act: string, aIdx: number) => (
                        <li key={aIdx}>{act}</li>
                      ))}
                    </ul>
                    <span className="text-xs text-slate-450 italic block">
                      Expected observation: {plan.expected_observation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Irrigation & Nutrition & Pest Guidance Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-base">Irrigation Guidance</h4>
            <p className="text-sm text-slate-650 leading-relaxed">{rep.irrigation_guidance.recommendation}</p>
            {rep.irrigation_guidance.cautions.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-450 uppercase block mb-1">Cautions</span>
                <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                  {rep.irrigation_guidance.cautions.map((c: string, idx: number) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-base">Soil & Nutrition Guidance</h4>
            <p className="text-sm text-slate-655 leading-relaxed">{rep.soil_nutrition_guidance.recommendation}</p>
            {rep.soil_nutrition_guidance.cautions.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-455 block mb-1 uppercase">Cautions</span>
                <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                  {rep.soil_nutrition_guidance.cautions.map((c: string, idx: number) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Pest and Disease specifics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-base">Pest, Disease & Weed Management</h4>
          <p className="text-sm text-slate-650 leading-relaxed">{rep.pest_disease_guidance.observation}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-450 uppercase block">Integrated management measures</span>
              <ul className="list-disc list-inside text-slate-550 space-y-1">
                {rep.pest_disease_guidance.integrated_management.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 font-semibold leading-relaxed">
              <span className="font-bold text-red-950 block text-[10px] uppercase mb-1">Chemical Application Rules</span>
              {rep.pest_disease_guidance.chemical_safety}
            </div>
          </div>
        </div>

        {/* Monitoring checklist & Escalations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-base">Monitoring Checklist</h4>
            <ul className="list-disc list-inside text-sm text-slate-655 space-y-1">
              {rep.monitoring_checklist.map((chk: string, idx: number) => (
                <li key={idx}>{chk}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-base">Escalation Conditions</h4>
            <ul className="list-disc list-inside text-sm text-slate-655 space-y-1">
              {rep.escalation_conditions.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top action header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 no-print">
        <div className="flex items-center space-x-2">
          <Link
            to="/advisories"
            className="bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:text-slate-700 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Advisory Report Details</h2>
            <p className="text-xs text-slate-450">
              Submitted on {new Date(request.createdAt).toLocaleDateString()} for {request.cropName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-white border border-slate-350 hover:bg-slate-50 text-slate-800 font-semibold px-4 py-2.5 rounded-xl shadow-sm text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this advisory report?")) {
                deleteMutation.mutate();
              }
            }}
            className="flex items-center space-x-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Generating/Queueing progress screens */}
      {(request.status === "generating" || request.status === "queued") && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sprout className="w-6 h-6 text-emerald-600 animate-bounce" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-xl">AI Advisor is working...</h3>
            <p className="text-slate-550 text-sm max-w-sm mx-auto leading-relaxed">
              Assessing technical soil ph, fertilizer parameters, rainfall patterns, and cropping histories. Report will load automatically in seconds.
            </p>
          </div>
        </div>
      )}

      {/* Failure screen */}
      {request.status === "failed" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-6">
          <div className="bg-rose-50 text-rose-600 p-4 rounded-full border border-rose-200 inline-block">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-lg">AI Report Generation Failed</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              We encountered a transient error while calling the Gemini API or validating the structured report parameters.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-w-md mx-auto text-xs text-slate-600 font-mono text-left">
              Error code: {request.errorCode || "AI_TIMEOUT"}<br/>
              Message: {request.errorMessage || "Google Gemini is currently busy. Please retry."}
            </div>
          </div>
          {request.generationAttempts < 3 ? (
            <button
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-lg shadow-md transition-colors"
            >
              {retryMutation.isPending ? "Retrying..." : "Retry Analysis"}
            </button>
          ) : (
            <p className="text-xs text-rose-650 font-semibold">
              Maximum retry limit of 3 attempts exceeded. Create a new request instead.
            </p>
          )}
        </div>
      )}

      {/* Success report presentation details */}
      {request.status === "completed" && report && (
        <div className="space-y-6">
          {/* Print specific header title */}
          <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-3xl font-extrabold font-sans text-slate-900">AgriGuide Crop Advisory Report</h1>
            <p className="text-sm text-slate-500 mt-2">
              Generated by model {metadata?.modelName} (prompt {metadata?.promptVersion}) on {new Date(metadata?.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Report Metadata overview cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div>
              <span className="text-slate-400 text-xs font-medium block">Report Title</span>
              <span className="text-slate-900 font-extrabold text-base leading-tight">
                {report.title || `${request.cropName} Advisory`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-medium block">Confidence Metric</span>
              <span className={`inline-flex items-center space-x-1 mt-1 text-xs font-bold px-2.5 py-1 rounded-full uppercase border ${
                report.confidence === "high"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : report.confidence === "medium"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}>
                {report.confidence}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-medium block">Crop & Stage</span>
              <span className="text-slate-900 font-bold capitalize">
                {request.cropName} ({request.growthStage.replace("_", " ")})
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-medium block">Category</span>
              <span className="text-slate-900 font-bold capitalize block truncate">
                {request.category.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* One-Sentence Summary Card */}
          <div className="bg-emerald-50 border border-emerald-250/60 rounded-2xl p-6 shadow-sm space-y-2">
            <h4 className="font-extrabold text-emerald-950 text-base">Observations Summary</h4>
            <p className="text-emerald-900 text-sm leading-relaxed font-semibold">
              {report.summary}
            </p>
          </div>

          {/* AI Understanding Section */}
          {report.understanding && report.understanding.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-base">Parameters Understood by AI</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                {report.understanding.map((u: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Render structured details depending on categories */}
          {request.category === "crop_selection" && renderCropSelection(report)}
          {request.category === "pest_disease" && renderPestDisease(report)}
          {request.category !== "crop_selection" && request.category !== "pest_disease" && renderGeneralAdvisory(report)}

          {/* Common sections: Missing info, safety, disclaimers */}
          {report.missing_information && report.missing_information.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-base">Missing Advisory Information</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gemini noted these parameters were missing or not entered. Providing these in future requests will improve report quality and confidence.
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                {report.missing_information.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings & Disclaimer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-inside-avoid">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm space-y-3">
              <h4 className="font-bold text-orange-950 text-base flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-700" />
                <span>Agricultural Safety Notice</span>
              </h4>
              <p className="text-orange-900 text-xs leading-relaxed font-semibold">
                {report.safety_notice}
              </p>
            </div>

            <div className="bg-slate-100 border border-slate-250 rounded-2xl p-6 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <Info className="w-5 h-5 text-slate-600" />
                <span>Scientific Advisory Disclaimer</span>
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {report.disclaimer}
              </p>
            </div>
          </div>

          {/* Feedback Form Control (no-print) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm no-print">
            <h3 className="font-extrabold text-slate-900 text-lg border-b pb-2 mb-4">Advisory Helpfulness Feedback</h3>
            
            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-250 max-w-sm mx-auto flex items-center justify-center space-x-2 text-sm font-semibold">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Feedback submitted successfully. Thank you!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackSubmitted(false)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Edit previous feedback
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmitFeedback)} className="space-y-4 max-w-xl">
                {/* Helpful toggle */}
                <div>
                  <span className="block text-sm font-semibold text-slate-700 mb-2">Was this advisory helpful? *</span>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setValue("helpful", true)}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-xl font-semibold text-sm ${
                        watchedHelpful
                          ? "bg-emerald-50 text-emerald-800 border-emerald-500"
                          : "bg-white border-slate-350 text-slate-750"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Yes, useful</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("helpful", false)}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-xl font-semibold text-sm ${
                        !watchedHelpful
                          ? "bg-rose-50 text-rose-800 border-rose-500"
                          : "bg-white border-slate-350 text-slate-750"
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>No, not useful</span>
                    </button>
                  </div>
                </div>

                {/* Rating 1-5 */}
                <div>
                  <span className="block text-sm font-semibold text-slate-700 mb-2">Grower Rating (1-5)</span>
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setValue("rating", num)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            num <= (watchedRating || 5)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Comment */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Optional Comments</label>
                  <textarea
                    {...register("comment")}
                    rows={3}
                    className="block w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Tell us what was good or what could be improved..."
                  />
                  {errors.comment && <p className="text-red-500 text-xs font-semibold mt-1">{errors.comment.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={feedbackMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors uppercase tracking-wider"
                >
                  Submit Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AdvisoryDetailPage;
