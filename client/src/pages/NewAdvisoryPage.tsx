import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { advisoryRequestSchema } from "shared";
import { api, ApiError } from "../lib/apiClient.js";
import {
  Sprout,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileImage,
  Upload,
  X,
  Microscope,
  Info
} from "lucide-react";
import { z } from "zod";

type AdvisoryFormInputs = z.infer<typeof advisoryRequestSchema>;

interface LocalImage {
  data: string; // Base64 content without prefix
  mimeType: string;
  previewUrl: string;
  name: string;
}

export const NewAdvisoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedCategory = searchParams.get("category") || "general";

  const [step, setStep] = useState(1);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => Math.random().toString(36).substring(2, 15));

  // Queries
  const { data: farms = [] } = useQuery({
    queryKey: ["farms"],
    queryFn: api.farms.list,
  });

  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const { data: fields = [] } = useQuery({
    queryKey: ["fields", selectedFarmId],
    queryFn: () => api.fields.list(selectedFarmId),
    enabled: !!selectedFarmId,
  });

  // Forms hook
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<AdvisoryFormInputs>({
    resolver: zodResolver(advisoryRequestSchema),
    defaultValues: {
      category: preSelectedCategory as any,
      cropName: "",
      cropVariety: "",
      growthStage: "unknown",
      question: "",
      preferredLanguage: "en",
      detailLevel: "standard",
      priorityPreference: "general",
      soil: {
        type: "",
        ph: null,
        nitrogen: null,
        phosphorus: null,
        potassium: null,
        organicMatter: null,
      },
      water: {
        irrigationAvailability: "none",
        source: "",
        recentIrrigation: "",
        recentRainfall: "",
      },
      symptoms: "",
      affectedPercentage: null,
      symptomStartDate: null,
      recentApplications: "",
      weatherStress: "",
      notes: "",
    },
  });

  // Set default farm when fetched
  useEffect(() => {
    if (farms.length > 0) {
      const defaultFarm = farms.find((f: any) => f.isDefault) || farms[0];
      setSelectedFarmId(defaultFarm.id);
      setValue("farmId", defaultFarm.id);
    }
  }, [farms, setValue]);

  const watchedFarmId = watch("farmId");
  useEffect(() => {
    if (watchedFarmId) {
      setSelectedFarmId(watchedFarmId);
    }
  }, [watchedFarmId]);

  // Handle image upload and base64 conversion
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      setImageError("Maximum of 3 images can be uploaded.");
      return;
    }

    files.forEach((file) => {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setImageError(`File ${file.name} exceeds the 5MB size limit.`);
        return;
      }

      // Validate MIME type
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setImageError(`File ${file.name} is not a valid JPEG, PNG, or WebP image.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setImages((prev) => [
          ...prev,
          {
            data: base64String,
            mimeType: file.type,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Step Navigations
  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = ["category", "cropName", "question", "growthStage"];
    } else if (step === 2) {
      fieldsToValidate = ["farmId", "fieldId", "soil.ph", "soil.nitrogen", "soil.phosphorus", "soil.potassium", "soil.organicMatter"];
    } else if (step === 3) {
      fieldsToValidate = ["affectedPercentage", "symptomStartDate"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: AdvisoryFormInputs) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const payload = {
        ...data,
        images: images.map((img) => ({
          data: img.data,
          mimeType: img.mimeType,
        })),
        idempotencyKey,
      };

      const response = await api.advisories.create(payload);
      
      // Since Advisory creation is async, we redirect the user to history or wait on the detail page.
      // The detail page handles showing the "generating" loader state!
      navigate(`/advisories/${response.id}`);
    } catch (err: any) {
      setApiError(err.message || "Failed to submit advisory request.");
      setIsSubmitting(false);
    }
  };

  const stepsList = ["Advisory Details", "Soil & Water", "Crop Symptoms", "Photos", "Output"];

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:text-slate-700 shadow-sm"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">Ask AgriGuide AI</h2>
          <p className="text-sm text-slate-500">Provide field details to generate precision advice.</p>
        </div>
      </div>

      {/* Steps Progress Indicator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm no-print">
        <div className="flex items-center justify-between">
          {stepsList.map((name, idx) => {
            const num = idx + 1;
            const isCompleted = step > num;
            const isActive = step === num;
            return (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center space-y-1 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                      isCompleted
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : isActive
                        ? "bg-emerald-50 border-emerald-600 text-emerald-700"
                        : "bg-white border-slate-300 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : num}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-semibold ${
                      isActive ? "text-slate-900 font-bold" : "text-slate-400"
                    }`}
                  >
                    {name}
                  </span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${
                      step > num ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  ></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Wizard Form Wrapper */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isSubmitting ? (
          <div className="p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative">
              {/* Spinning agricultural loader */}
              <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sprout className="w-6 h-6 text-emerald-600 animate-bounce" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-xl font-sans">Generating Crop Advisory...</h3>
              <p className="text-slate-550 text-sm max-w-sm mx-auto leading-relaxed">
                Google Gemini is assessing your soil values, crop growth cycle, symptoms, and environment details. This will take up to 20 seconds.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-red-800">{apiError}</span>
              </div>
            )}

            {/* STEP 1: Basic details */}
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Step 1: Advisory details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Advisory Category *</label>
                    <select
                      {...register("category")}
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                    >
                      <option value="crop_selection">Crop Selection & Suitability</option>
                      <option value="land_preparation">Land Preparation</option>
                      <option value="seed_selection">Seed Selection</option>
                      <option value="sowing_planting">Sowing & Planting</option>
                      <option value="irrigation">Irrigation Scheduling</option>
                      <option value="soil_nutrition">Soil & Nutrition</option>
                      <option value="pest_disease">Pest & Disease Triage</option>
                      <option value="weed_management">Weed Management</option>
                      <option value="weather_stress">Weather & Environmental Stress</option>
                      <option value="growth_stage">Growth Stage Management</option>
                      <option value="harvest">Harvest Readiness</option>
                      <option value="post_harvest">Post-Harvest Handling</option>
                      <option value="general">General Crop Planning</option>
                    </select>
                  </div>

                  {/* Crop Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Crop Name *</label>
                    <input
                      type="text"
                      {...register("cropName")}
                      className="mt-1 block w-full px-3 py-2.5 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="e.g. Tomato, Rice, Wheat"
                    />
                    {errors.cropName && <p className="text-red-500 text-xs font-semibold mt-1">{errors.cropName.message}</p>}
                  </div>

                  {/* Crop Variety */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Variety / Cultivar (Optional)</label>
                    <input
                      type="text"
                      {...register("cropVariety")}
                      className="mt-1 block w-full px-3 py-2.5 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="e.g. Roma, Basmati"
                    />
                  </div>

                  {/* Growth Stage */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Crop Growth Stage *</label>
                    <select
                      {...register("growthStage")}
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                    >
                      <option value="pre_sowing">Pre-Sowing / Sowing Preparation</option>
                      <option value="seedling">Seedling / Emergence</option>
                      <option value="vegetative">Vegetative Growth</option>
                      <option value="flowering">Flowering / Heading</option>
                      <option value="fruiting_grain_filling">Fruiting / Grain Filling</option>
                      <option value="maturity">Ripening / Maturity</option>
                      <option value="harvest">Harvesting Cycle</option>
                      <option value="post_harvest">Post-Harvest / Storage</option>
                      <option value="unknown">I Don't Know</option>
                    </select>
                  </div>

                  {/* Question */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700">User's Question / Scenario *</label>
                    <textarea
                      {...register("question")}
                      rows={5}
                      className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="Be specific. Explain the immediate issue, symptoms, changes, and what help you require. (minimum 10 characters)"
                    />
                    {errors.question && <p className="text-red-500 text-xs font-semibold mt-1">{errors.question.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Soil & Water details */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-bold text-slate-800">Step 2: Location and farm context</h3>
                  <p className="text-xs text-slate-500">Link this request to an existing farm and plot profile to feed coordinates, soil textures, and irrigation constraints into Gemini.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Farm selector */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Select Farm *</label>
                    <select
                      {...register("farmId")}
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                    >
                      <option value="">-- No associated farm --</option>
                      {farms.map((f: any) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.locality || f.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field selector */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Select Field Plot (Optional)</label>
                    <select
                      {...register("fieldId")}
                      disabled={!selectedFarmId}
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg disabled:opacity-50"
                    >
                      <option value="">-- No associated plot --</option>
                      {fields.map((f: any) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.currentCrop || "No Crop"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Technical soil test toggle details */}
                  <div className="md:col-span-2 pt-2">
                    <h4 className="font-bold text-slate-800 text-sm mb-3">Optional Soil Test Measurements</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600">Soil pH</label>
                        <input
                          type="number"
                          step="any"
                          {...register("soil.ph", { valueAsNumber: true })}
                          className="mt-1 block w-full px-3 py-1.5 border border-slate-350 rounded-lg sm:text-sm focus:ring-emerald-550"
                          placeholder="0 - 14"
                        />
                        {errors.soil?.ph && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.soil.ph.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600">Nitrogen (N)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("soil.nitrogen", { valueAsNumber: true })}
                          className="mt-1 block w-full px-3 py-1.5 border border-slate-350 rounded-lg sm:text-sm"
                          placeholder="ppm or kg/ha"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600">Phosphorus (P)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("soil.phosphorus", { valueAsNumber: true })}
                          className="mt-1 block w-full px-3 py-1.5 border border-slate-350 rounded-lg sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600">Potassium (K)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("soil.potassium", { valueAsNumber: true })}
                          className="mt-1 block w-full px-3 py-1.5 border border-slate-350 rounded-lg sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600">Organic Matter (%)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("soil.organicMatter", { valueAsNumber: true })}
                          className="mt-1 block w-full px-3 py-1.5 border border-slate-350 rounded-lg sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Crop conditions */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Step 3: Crop health conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Visible symptoms */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700">Visible Symptoms (Optional)</label>
                    <textarea
                      {...register("symptoms")}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg sm:text-sm"
                      placeholder="Describe color changes, leaf spots, wilting, insect sightings, or chewing marks..."
                    />
                  </div>

                  {/* Affected crop percentage */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Affected Crop Percentage (%)</label>
                    <input
                      type="number"
                      {...register("affectedPercentage", { valueAsNumber: true })}
                      className="mt-1 block w-full px-3 py-2.5 border border-slate-350 rounded-lg sm:text-sm"
                      placeholder="0 - 100"
                    />
                    {errors.affectedPercentage && <p className="text-red-500 text-xs font-semibold mt-1">{errors.affectedPercentage.message}</p>}
                  </div>

                  {/* Symptom start date */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Symptom Start Date</label>
                    <input
                      type="date"
                      {...register("symptomStartDate")}
                      className="mt-1 block w-full px-3 py-2.5 border border-slate-350 rounded-lg sm:text-sm"
                    />
                    {errors.symptomStartDate && <p className="text-red-500 text-xs font-semibold mt-1">{errors.symptomStartDate.message}</p>}
                  </div>

                  {/* Recent applications */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700">Recent Fertilizer or Pesticide Applications</label>
                    <input
                      type="text"
                      {...register("recentApplications")}
                      className="mt-1 block w-full px-3 py-2.5 border border-slate-350 rounded-lg sm:text-sm"
                      placeholder="e.g. Applied NPK 19-19-19 and Copper Oxychloride 5 days ago"
                    />
                  </div>

                  {/* Weather stress */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700">Recent Weather Stress (Optional)</label>
                    <input
                      type="text"
                      {...register("weatherStress")}
                      className="mt-1 block w-full px-3 py-2.5 border border-slate-350 rounded-lg sm:text-sm"
                      placeholder="e.g. Heavy rainfall last week, followed by hot sunny days"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Images */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-bold text-slate-800">Step 4: Leaf and crop images</h3>
                  <p className="text-xs text-slate-550">Upload up to three optional photos. High resolution close-ups of leaves help Gemini's visual observations.</p>
                </div>

                <div className="space-y-4">
                  {imageError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center space-x-2 text-xs font-semibold text-red-800">
                      <X className="w-4.5 h-4.5" />
                      <span>{imageError}</span>
                    </div>
                  )}

                  {/* Image Dropzone Picker */}
                  {images.length < 3 && (
                    <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors relative">
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        aria-label="Upload crop images"
                      />
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-10 h-10 text-slate-400" />
                        <span className="text-slate-850 font-bold text-sm">Select JPG, PNG, or WebP</span>
                        <span className="text-slate-450 text-xs">Maximum 5 MB per image. Up to {3 - images.length} remaining.</span>
                      </div>
                    </div>
                  )}

                  {/* Previews grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50 group">
                          <img
                            src={img.previewUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-900 text-white p-1 rounded-full shadow transition-colors"
                            aria-label="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-blue-900 leading-relaxed font-semibold">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>
                      Image analysis is indicative and based solely on visual observations. It is not an alternate to pathological laboratory testing. Image bytes are processed temporarily and are not stored permanently.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Preferences */}
            {step === 5 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Step 5: Output preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Language */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Advisory Language *</label>
                    <select
                      {...register("preferredLanguage")}
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi (हिंदी)</option>
                    </select>
                  </div>

                  {/* Level of detail */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Desired level of detail</label>
                    <select
                      {...register("detailLevel")}
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                    >
                      <option value="quick">Quick Answer (Prioritized summary)</option>
                      <option value="standard">Standard Detailed Response</option>
                      <option value="detailed">Comprehensive Deep Dive</option>
                    </select>
                  </div>

                  {/* Priorities */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Grower Priority</label>
                    <select
                      {...register("priorityPreference")}
                      className="mt-1 block w-full pl-3 pr-10 py-2.5 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                    >
                      <option value="general">General Guidance</option>
                      <option value="reduce_cost">Reduce Fertilizer/Chemical Costs</option>
                      <option value="reduce_water">Reduce Water Usage / Drought Plan</option>
                      <option value="maximize_yield">Maximize Crop Yield</option>
                      <option value="organic_compatible">Organic-Compatible measures</option>
                      <option value="reduce_crop_loss">Mitigate Severe Crop Loss</option>
                    </select>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 pt-4">
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-bold text-sm">Final Submission review</span>
                  </div>
                  <p className="text-emerald-900 text-xs leading-relaxed font-semibold">
                    By submitting, this advisory context is sent to Google Gemini for structured reasoning. You can review and print the finalized report, track actions, or retry if AI timeouts occur.
                  </p>
                </div>
              </div>
            )}

            {/* Navigations buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 font-semibold text-sm">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-750 px-5 py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-slate-500"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div></div>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg shadow-md transition-colors focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <span>Generate Report</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default NewAdvisoryPage;
