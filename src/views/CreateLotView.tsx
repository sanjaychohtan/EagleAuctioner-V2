import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useCreateLotMutation, useAuctionDetails } from "../hooks/useAuctionQueries";
import { lotSchema, LotSchemaType } from "../validation/auctionSchema";
import { useNotification } from "../providers/NotificationProvider";
import { handleApiError } from "../api/errorHandler";
import { AuctionState } from "../types/auction";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  FileText,
  DollarSign,
  Package,
  Loader2
} from "lucide-react";

export const CreateLotView: React.FC = () => {
  const { id: auctionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showNotification } = useNotification();

  const { data: auction, isLoading, isError } = useAuctionDetails(auctionId || "");
  const createLotMut = useCreateLotMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LotSchemaType>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      lotNumber: "",
      title: "",
      description: "",
      materialCategory: "",
      quantity: 1,
      unitOfMeasure: "EA",
      startingPrice: 0,
      reservePrice: null,
      minimumIncrement: 1,
      currency: auction?.currency || "USD",
    },
  });

  if (!hasRole("SELLER")) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center font-mono text-xs space-y-4">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-white uppercase tracking-wider">Access Restrained</p>
        <p className="text-slate-400">Only SELLER credentials can create lots.</p>
        <button
          onClick={() => navigate(`/auctions/${auctionId}/lots`)}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg cursor-pointer font-bold"
        >
          Return to Manifest
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <span>INITIALIZING LOT CREATION ENGINE...</span>
      </div>
    );
  }

  if (isError || !auction || (auction.state !== AuctionState.DRAFT && auction.state !== AuctionState.REJECTED)) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3">
        <AlertTriangle className="h-10 w-10 mx-auto text-rose-500" />
        <p className="font-bold uppercase">Invalid Campaign State</p>
        <p className="text-slate-400">Campaign must be in DRAFT mode to create lots.</p>
        <button
          onClick={() => navigate(`/auctions/${auctionId}/lots`)}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Return to Manifest
        </button>
      </div>
    );
  }

  const onSubmit = async (data: LotSchemaType) => {
    if (!auctionId) return;
    setFormError(null);
    try {
      await createLotMut.mutateAsync({ auctionId, request: data });
      showNotification("Lot created successfully", "success");
      navigate(`/auctions/${auctionId}/lots`);
    } catch (err: any) {
      const friendly = handleApiError(err);
      setFormError(friendly.message);
      showNotification(friendly.message, "error");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-mono text-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/auctions/${auctionId}/lots`)}
          className="flex items-center justify-center p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Lot Origination</span>
          <h2 className="text-lg font-bold text-white">DRAFT NEW LOT</h2>
        </div>
      </div>

      {formError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 flex items-start gap-2.5">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <p className="font-bold uppercase tracking-wider">Validation Error</p>
            <p className="text-slate-400 mt-1">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <FileText className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="font-bold uppercase tracking-wider text-white">Lot Specifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Lot Number</label>
              <input
                {...register("lotNumber")}
                placeholder="e.g. L-1001"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {errors.lotNumber && <p className="text-[9px] text-rose-400">{errors.lotNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Title</label>
              <input
                {...register("title")}
                placeholder="e.g. Premium Steel Coils"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {errors.title && <p className="text-[9px] text-rose-400">{errors.title.message}</p>}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Detailed material specs..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {errors.description && <p className="text-[9px] text-rose-400">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Package className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="font-bold uppercase tracking-wider text-white">Material & Quantity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Material Category</label>
              <input
                {...register("materialCategory")}
                placeholder="e.g. FERROUS"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {errors.materialCategory && <p className="text-[9px] text-rose-400">{errors.materialCategory.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
              <input
                type="number"
                step="any"
                {...register("quantity", { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {errors.quantity && <p className="text-[9px] text-rose-400">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Unit of Measure</label>
              <input
                {...register("unitOfMeasure")}
                placeholder="e.g. MT, EA"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {errors.unitOfMeasure && <p className="text-[9px] text-rose-400">{errors.unitOfMeasure.message}</p>}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <DollarSign className="h-4.5 w-4.5 text-amber-400" />
            <h3 className="font-bold uppercase tracking-wider text-white">Commercial Terms</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Starting Price</label>
              <input
                type="number"
                step="any"
                {...register("startingPrice", { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {errors.startingPrice && <p className="text-[9px] text-rose-400">{errors.startingPrice.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Reserve Price</label>
              <input
                type="number"
                step="any"
                {...register("reservePrice", { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {errors.reservePrice && <p className="text-[9px] text-rose-400">{errors.reservePrice.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Min. Increment</label>
              <input
                type="number"
                step="any"
                {...register("minimumIncrement", { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {errors.minimumIncrement && <p className="text-[9px] text-rose-400">{errors.minimumIncrement.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Currency</label>
              <input
                {...register("currency")}
                placeholder="USD"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 uppercase"
              />
              {errors.currency && <p className="text-[9px] text-rose-400">{errors.currency.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/40">
          <button
            type="button"
            disabled={createLotMut.isPending}
            onClick={() => navigate(`/auctions/${auctionId}/lots`)}
            className="px-5 py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/60 rounded-xl font-bold uppercase text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createLotMut.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase shadow-lg shadow-indigo-600/15 cursor-pointer transition-all"
          >
            {createLotMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Generate Record</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLotView;
