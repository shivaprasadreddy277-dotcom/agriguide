import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fieldCreateSchema } from "shared";
import { api } from "../lib/apiClient.js";
import { queryClient } from "../lib/queryClient.js";
import { Layers, Plus, MapPin, Edit2, Trash2, ShieldAlert, X, Landmark, FileText, ChevronRight } from "lucide-react";
import { z } from "zod";

type FieldFormInputs = z.infer<typeof fieldCreateSchema>;

export const FarmDetailPage: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Queries
  const { data: farm, isLoading: isLoadingFarm } = useQuery({
    queryKey: ["farm", farmId],
    queryFn: () => api.farms.get(farmId!),
    enabled: !!farmId,
  });

  const { data: fields = [], isLoading: isLoadingFields } = useQuery({
    queryKey: ["fields", farmId],
    queryFn: () => api.fields.list(farmId!),
    enabled: !!farmId,
  });

  // Recent advisories associated with this farm (from query)
  const { data: advisoriesData } = useQuery({
    queryKey: ["advisories", { farmId }],
    queryFn: () => api.advisories.list({ page: 1, pageSize: 5, category: undefined }),
    enabled: !!farmId,
  });

  const recentRequests = (advisoriesData?.requests || []).filter((r: any) => r.farmId === farmId);

  // Mutations
  const createFieldMutation = useMutation({
    mutationFn: (data: FieldFormInputs) => api.fields.create(farmId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields", farmId] });
      closeModal();
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FieldFormInputs> }) =>
      api.fields.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields", farmId] });
      closeModal();
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: api.fields.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields", farmId] });
      setDeleteConfirmId(null);
    },
  });

  // Forms hook
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldFormInputs>({
    resolver: zodResolver(fieldCreateSchema),
    defaultValues: {
      areaUnit: "hectare",
    },
  });

  const openCreateModal = () => {
    setEditingField(null);
    reset({
      name: "",
      area: null,
      areaUnit: "hectare",
      soilType: "",
      irrigationMethod: "",
      waterSource: "",
      currentCrop: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (field: any) => {
    setEditingField(field);
    reset({
      name: field.name,
      area: field.area || null,
      areaUnit: field.areaUnit,
      soilType: field.soilType || "",
      irrigationMethod: field.irrigationMethod || "",
      waterSource: field.waterSource || "",
      currentCrop: field.currentCrop || "",
      notes: field.notes || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingField(null);
  };

  const onSubmit = (data: FieldFormInputs) => {
    if (editingField) {
      updateFieldMutation.mutate({ id: editingField.id, data });
    } else {
      createFieldMutation.mutate(data);
    }
  };

  if (isLoadingFarm) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white border border-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-white border border-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto">
        <Landmark className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Farm Not Found</h3>
        <p className="text-slate-500 text-sm mt-2">The farm profile you requested does not exist or has been deleted.</p>
        <Link to="/farms" className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700">
          Back to Farms List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Farm Details Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex items-start space-x-4">
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl shrink-0">
            <Landmark className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{farm.name}</h2>
              {farm.isDefault && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">
                  Default
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-slate-500 text-xs mt-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {farm.locality ? `${farm.locality}, ` : ""}
                {farm.stateProvince ? `${farm.stateProvince}, ` : ""}
                {farm.country}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm tracking-wide shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Add Crop Plot</span>
        </button>
      </div>

      {/* Main Grid: Left Fields List | Right Side Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fields list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Plots & Fields ({fields.length})</span>
            </h3>

            {isLoadingFields ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : fields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field: any) => (
                  <div
                    key={field.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-sm transition-all bg-slate-50/30"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-base leading-tight">{field.name}</h4>
                        {field.currentCrop && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 px-2 py-0.5 rounded-md uppercase">
                            🌱 {field.currentCrop}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-550 pt-1">
                        <div>
                          <span className="text-slate-400 font-medium block">Area</span>
                          <span className="text-slate-800 font-bold">
                            {field.area ? `${field.area} ${field.areaUnit}` : "Not set"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">Soil Texture</span>
                          <span className="text-slate-800 font-bold block truncate">{field.soilType || "Not set"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 mt-3 border-t border-slate-100 text-xs font-semibold">
                      <button
                        onClick={() => openEditModal(field)}
                        className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 px-2 py-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(field.id)}
                        className="flex items-center space-x-1 text-rose-500 hover:text-rose-700 px-2 py-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="bg-slate-50 p-4 rounded-full border border-slate-200/50 inline-block text-slate-400">
                  <Layers className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">No Plots Configured</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Map individual plots or greenhouses to refine crop growth plans and visual disease triage reports.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Farm Details & Recent Requests */}
        <div className="lg:col-span-1 space-y-6">
          {/* Notes Block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base">Farm Notes & Profile</h3>
            <div className="text-sm space-y-2 text-slate-655 font-medium leading-relaxed">
              {farm.notes ? (
                <p className="whitespace-pre-line">{farm.notes}</p>
              ) : (
                <p className="italic text-slate-400 text-xs">No planning notes saved for this farm.</p>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
              <div>
                <span className="text-slate-400 font-semibold block">Water Source:</span>
                <span className="text-slate-800 font-bold">{farm.waterSource || "Not configured"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Irrigation availability:</span>
                <span className="text-slate-800 font-bold capitalize">{farm.irrigationAvailability || "Not configured"}</span>
              </div>
            </div>
          </div>

          {/* Recent Advisories */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Recent Advisories</h3>
            {recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((req: any) => (
                  <Link
                    key={req.id}
                    to={`/advisories/${req.id}`}
                    className="flex items-center justify-between p-3 border border-slate-200 hover:border-emerald-350 rounded-xl hover:shadow-sm transition-all group"
                  >
                    <div className="truncate pr-3 space-y-0.5">
                      <span className="font-bold text-slate-800 text-xs block">{req.cropName}</span>
                      <span className="text-[10px] text-slate-455 block truncate">{req.question}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-450 italic">
                No report requests registered for this farm profile.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Field Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start space-x-3.5">
              <div className="bg-red-50 text-red-655 p-3 rounded-full shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-base">Delete Plot profile</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete this field plot? This will delete all historic generated crop advisories associated with this plot.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 text-sm font-semibold">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFieldMutation.mutate(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Delete Plot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Plot Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl relative">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingField ? "Edit Plot Properties" : "Create Crop Plot"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plot Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Plot / Field Name *</label>
                  <input
                    type="text"
                    {...register("name")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. North Greenhouse"
                  />
                  {errors.name && <p className="text-red-500 text-xs font-semibold mt-1">{errors.name.message}</p>}
                </div>

                {/* Plot Area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Plot Area</label>
                  <input
                    type="number"
                    step="any"
                    {...register("area", { valueAsNumber: true })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. 1.2"
                  />
                  {errors.area && <p className="text-red-500 text-xs font-semibold mt-1">{errors.area.message}</p>}
                </div>

                {/* Area Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Area Unit</label>
                  <select
                    {...register("areaUnit")}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                  >
                    <option value="hectare">Hectare</option>
                    <option value="acre">Acre</option>
                    <option value="square_meter">Square Meter</option>
                    <option value="square_feet">Square Feet</option>
                  </select>
                </div>

                {/* Soil type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Soil Type</label>
                  <input
                    type="text"
                    {...register("soilType")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. Clayey, Silt"
                  />
                </div>

                {/* Current Crop */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Current Crop Planted</label>
                  <input
                    type="text"
                    {...register("currentCrop")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. Tomato, Chilli"
                  />
                </div>

                {/* Irrigation Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Irrigation Method</label>
                  <input
                    type="text"
                    {...register("irrigationMethod")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. Drip, Sprinkler"
                  />
                </div>

                {/* Water Source */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Water Source</label>
                  <input
                    type="text"
                    {...register("waterSource")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. Borewell"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Notes / Remarks</label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Add plot description notes here..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3 text-sm font-semibold shrink-0 bg-slate-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg shadow transition-colors flex items-center space-x-2"
                >
                  {(createFieldMutation.isPending || updateFieldMutation.isPending) && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{editingField ? "Save Changes" : "Create Plot"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FarmDetailPage;
