import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { farmCreateSchema } from "shared";
import { api, ApiError } from "../lib/apiClient.js";
import { queryClient } from "../lib/queryClient.js";
import { Sprout, Plus, MapPin, Eye, Edit2, Trash2, ShieldAlert, Globe, X, Landmark } from "lucide-react";
import { z } from "zod";

type FarmFormInputs = z.infer<typeof farmCreateSchema>;

export const FarmsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Queries & Mutations
  const { data: farms = [], isLoading } = useQuery({
    queryKey: ["farms"],
    queryFn: api.farms.list,
  });

  const createMutation = useMutation({
    mutationFn: api.farms.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FarmFormInputs> }) =>
      api.farms.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.farms.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      setDeleteConfirmId(null);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: api.farms.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
  });

  // Forms setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FarmFormInputs>({
    resolver: zodResolver(farmCreateSchema),
    defaultValues: {
      areaUnit: "hectare",
      isDefault: false,
    },
  });

  const openCreateModal = () => {
    setEditingFarm(null);
    reset({
      name: "",
      country: "",
      stateProvince: "",
      districtCounty: "",
      locality: "",
      latitude: null,
      longitude: null,
      totalArea: null,
      areaUnit: "hectare",
      soilType: "",
      irrigationAvailability: "none",
      waterSource: "",
      notes: "",
      isDefault: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (farm: any) => {
    setEditingFarm(farm);
    reset({
      name: farm.name,
      country: farm.country,
      stateProvince: farm.stateProvince || "",
      districtCounty: farm.districtCounty || "",
      locality: farm.locality || "",
      latitude: farm.latitude || null,
      longitude: farm.longitude || null,
      totalArea: farm.totalArea || null,
      areaUnit: farm.areaUnit,
      soilType: farm.soilType || "",
      irrigationAvailability: farm.irrigationAvailability || "none",
      waterSource: farm.waterSource || "",
      notes: farm.notes || "",
      isDefault: farm.isDefault,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFarm(null);
  };

  const onSubmit = (data: FarmFormInputs) => {
    if (editingFarm) {
      updateMutation.mutate({ id: editingFarm.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Farm Profiles</h2>
          <p className="text-sm text-slate-500">Add, edit, and configure your farm boundaries and soil properties.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm tracking-wide"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Farm</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-48 animate-pulse"></div>
          ))}
        </div>
      ) : farms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {farms.map((farm: any) => (
            <div
              key={farm.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 relative ${
                farm.isDefault ? "border-emerald-500 ring-1 ring-emerald-500/30" : "border-slate-200"
              }`}
            >
              {farm.isDefault && (
                <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-250">
                  Default Farm
                </span>
              )}

              <div className="space-y-3">
                <div className="flex items-start space-x-3 pr-24">
                  <div className="bg-emerald-50 text-emerald-755 p-3 rounded-xl shrink-0">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{farm.name}</h3>
                    <div className="flex items-center space-x-1 text-slate-500 text-xs mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {farm.locality ? `${farm.locality}, ` : ""}
                        {farm.stateProvince || farm.country}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 font-medium block">Total Area</span>
                    <span className="text-slate-800 font-bold">
                      {farm.totalArea ? `${farm.totalArea} ${farm.areaUnit}` : "Not declared"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 font-medium block">Soil Profile</span>
                    <span className="text-slate-800 font-bold truncate block">{farm.soilType || "Not declared"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/farms/${farm.id}`}
                    className="flex items-center space-x-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Plots ({farm.fieldsCount || 0})</span>
                  </Link>
                  <button
                    onClick={() => openEditModal(farm)}
                    className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {!farm.isDefault && (
                    <button
                      onClick={() => setDefaultMutation.mutate(farm.id)}
                      className="text-emerald-600 hover:text-emerald-700 px-3 py-2 hover:underline"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirmId(farm.id)}
                    className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50"
                    aria-label="Delete farm"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-250/60 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-5">
          <div className="bg-slate-50 p-6 rounded-full border border-slate-200/50 inline-block">
            <Landmark className="w-12 h-12 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 text-lg">Add Your First Farm</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Setting up a farm profile lets the AI associate regional weather patterns, localized soil profiles, and water availability rules to your advisory requests.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-lg shadow-md transition-colors"
          >
            Create Farm Profile
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-red-50 text-red-600 p-3 rounded-full shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-lg">Delete Farm Profile</h3>
                <p className="text-sm text-slate-500">
                  Are you absolutely sure you want to delete this farm? This action is permanent and will delete all plots, crops, request histories, and generated advisories associated with this farm.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 text-sm font-semibold">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-colors"
              >
                Delete Farm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {editingFarm ? "Edit Farm Details" : "Register Farm Profile"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Form Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Farm Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Farm Name *</label>
                  <input
                    type="text"
                    {...register("name")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. Sunny Orchards"
                  />
                  {errors.name && <p className="text-red-500 text-xs font-semibold mt-1">{errors.name.message}</p>}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Country *</label>
                  <input
                    type="text"
                    {...register("country")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. India"
                  />
                  {errors.country && <p className="text-red-500 text-xs font-semibold mt-1">{errors.country.message}</p>}
                </div>

                {/* State/Province */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">State / Province</label>
                  <input
                    type="text"
                    {...register("stateProvince")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>

                {/* District/County */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">District / County</label>
                  <input
                    type="text"
                    {...register("districtCounty")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>

                {/* Locality/Village */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Village / Locality</label>
                  <input
                    type="text"
                    {...register("locality")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>

                {/* Total Area */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Total Farm Area</label>
                  <input
                    type="number"
                    step="any"
                    {...register("totalArea", { valueAsNumber: true })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. 5.5"
                  />
                  {errors.totalArea && <p className="text-red-500 text-xs font-semibold mt-1">{errors.totalArea.message}</p>}
                </div>

                {/* Area Unit */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Area Unit</label>
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

                {/* Soil Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Soil Type / Texture</label>
                  <input
                    type="text"
                    {...register("soilType")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. Sandy Loam, Clay"
                  />
                </div>

                {/* Irrigation Availability */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Irrigation Availability</label>
                  <select
                    {...register("irrigationAvailability")}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-slate-350 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-lg"
                  >
                    <option value="none">None (Rainfed only)</option>
                    <option value="rainfed">Rainfed</option>
                    <option value="partial">Partial</option>
                    <option value="reliable">Reliable</option>
                  </select>
                </div>

                {/* Coordinates (optional) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Latitude (decimal)</label>
                  <input
                    type="number"
                    step="any"
                    {...register("latitude", { valueAsNumber: true })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Longitude (decimal)</label>
                  <input
                    type="number"
                    step="any"
                    {...register("longitude", { valueAsNumber: true })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>

                {/* Water Source */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Water Source</label>
                  <input
                    type="text"
                    {...register("waterSource")}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="e.g. Borewell, Canal"
                  />
                </div>

                {/* Default checkbox */}
                <div className="flex items-center pt-6">
                  <input
                    id="isDefault"
                    type="checkbox"
                    {...register("isDefault")}
                    className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-slate-350 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm font-semibold text-slate-700">
                    Set as default farm profile
                  </label>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Notes / Remarks</label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-slate-350 rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Add farm planning notes here..."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3 text-sm font-semibold shrink-0 bg-slate-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg shadow transition-colors flex items-center space-x-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{editingFarm ? "Save Changes" : "Create Farm"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FarmsPage;
