import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuctionDetails, useDeleteLotMutation, useSortLotsMutation, useCreateLotMutation } from "../hooks/useAuctionQueries";
import { useNotification } from "../providers/NotificationProvider";
import { handleApiError } from "../api/errorHandler";
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Upload,
  GripVertical,
  Loader2,
  AlertTriangle,
  Gavel
} from "lucide-react";
import { AuctionState, AuctionLotResponse } from "../types/auction";

export const LotListView: React.FC = () => {
  const { id: auctionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showNotification } = useNotification();

  const { data: auction, isLoading, isError, error, refetch } = useAuctionDetails(auctionId || "");
  const deleteLotMut = useDeleteLotMutation({ auctionId: auctionId || "" });
  const sortLotsMut = useSortLotsMutation();
  const createLotMut = useCreateLotMutation();

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [localLots, setLocalLots] = useState<AuctionLotResponse[]>([]);

  // Sync local state when auction lots change
  React.useEffect(() => {
    if (auction?.lots) {
      setLocalLots([...auction.lots].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    }
  }, [auction?.lots]);

  if (!hasRole("SELLER")) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center font-mono text-xs space-y-4">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-white uppercase tracking-wider">Access Restrained</p>
        <p className="text-slate-400">Only SELLER credentials can manage campaign lots.</p>
        <button
          onClick={() => navigate(`/auctions/${auctionId}`)}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg cursor-pointer font-bold"
        >
          Return to Operational Sheet
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <span>PULLING LOT MANIFEST DATA...</span>
      </div>
    );
  }

  if (isError || !auction) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3">
        <AlertTriangle className="h-10 w-10 mx-auto text-rose-500" />
        <p className="font-bold uppercase">Record Retrieval Failure</p>
        <p className="text-slate-400">{error instanceof Error ? error.message : "Failed to read auction details."}</p>
        <button
          onClick={() => navigate("/auctions")}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Back to Registry
        </button>
      </div>
    );
  }

  // Allow modifications only in DRAFT state
  const isDraft = auction.state === AuctionState.DRAFT || auction.state === AuctionState.REJECTED;

  const handleDelete = async (lotId: string) => {
    if (!window.confirm("Are you sure you want to delete this lot?")) return;
    try {
      await deleteLotMut.mutateAsync(lotId);
      showNotification("Lot deleted successfully.", "success");
      refetch();
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(friendly.message, "error");
    }
  };

  const handleClone = async (lot: AuctionLotResponse) => {
    if (!auctionId) return;
    try {
      const request = {
        lotNumber: `${lot.lotNumber}-CLONE`,
        title: `${lot.title} (Clone)`,
        description: lot.description,
        materialCategory: lot.materialCategory,
        quantity: lot.quantity,
        unitOfMeasure: lot.unitOfMeasure,
        startingPrice: lot.startingPrice,
        reservePrice: lot.reservePrice,
        minimumIncrement: lot.minimumIncrement,
        currency: lot.currency,
      };
      await createLotMut.mutateAsync({ auctionId, request });
      showNotification("Lot cloned successfully.", "success");
      refetch();
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(friendly.message, "error");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    if (!isDraft) return;
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!isDraft || draggedItemIndex === null || draggedItemIndex === index) return;

    const newLots = [...localLots];
    const draggedItem = newLots[draggedItemIndex];
    newLots.splice(draggedItemIndex, 1);
    newLots.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setLocalLots(newLots);
  };

  const handleDragEnd = async () => {
    if (!isDraft || draggedItemIndex === null || !auctionId) return;
    setDraggedItemIndex(null);

    const sortedLotIds = localLots.map(l => l.id);
    try {
      await sortLotsMut.mutateAsync({ auctionId, request: { sortedLotIds } });
      showNotification("Lots reordered successfully.", "success");
      refetch();
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(friendly.message, "error");
      refetch(); // Revert on failure
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
      {/* Back Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/auctions/${auctionId}`)}
            className="flex items-center justify-center p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Lot Management</span>
            <h2 className="text-lg font-bold text-white">AUCTION: {auction.auctionNumber}</h2>
          </div>
        </div>

        {isDraft && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate(`/auctions/${auctionId}/lots/import`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl font-bold transition-all cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-emerald-400" />
              <span>Bulk Import</span>
            </button>
            <button
              onClick={() => navigate(`/auctions/${auctionId}/lots/create`)}
              className="flex items-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider shadow shadow-indigo-600/10 cursor-pointer transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Lot</span>
            </button>
          </div>
        )}
      </div>

      {!isDraft && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-400 flex items-start gap-2.5">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-yellow-500" />
          <div>
            <p className="font-bold uppercase tracking-wider">Modifications Locked</p>
            <p className="text-slate-400 mt-1">This campaign is not in DRAFT mode. Lots cannot be added, edited, or reordered.</p>
          </div>
        </div>
      )}

      {/* Lots List */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4 text-slate-200 uppercase tracking-wider">
          <Gavel className="h-4.5 w-4.5 text-indigo-400" />
          <h3 className="font-bold">Inventory Manifest ({localLots.length})</h3>
        </div>

        {localLots.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
            <Gavel className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p>No inventory lots discovered in manifest.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localLots.map((lot, index) => (
              <div
                key={lot.id}
                draggable={isDraft}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-950/60 border rounded-xl transition-all ${
                  draggedItemIndex === index ? 'opacity-50 border-indigo-500/50' : 'border-slate-850 hover:border-slate-700'
                } ${isDraft ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {isDraft && (
                    <div className="text-slate-600 hover:text-slate-400">
                      <GripVertical className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-indigo-400">{lot.lotNumber}</span>
                    <span className="text-sm font-bold text-slate-200 mt-0.5">{lot.title}</span>
                    <span className="text-[10px] text-slate-500 uppercase mt-1">
                      {lot.materialCategory} • {lot.quantity} {lot.unitOfMeasure}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase">Starting Price</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {lot.startingPrice.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{lot.currency}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/auctions/${auctionId}/lots/${lot.id}`)}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
                      title="View Details"
                    >
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </button>
                    {isDraft && (
                      <>
                        <button
                          onClick={() => handleClone(lot)}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 rounded-lg transition-all cursor-pointer"
                          title="Clone Lot"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/auctions/${auctionId}/lots/${lot.id}/edit`)}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-amber-400 rounded-lg transition-all cursor-pointer"
                          title="Edit Lot"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lot.id)}
                          className="p-2 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/30 text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Delete Lot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LotListView;
