import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuctions } from "../hooks/useAuctionQueries";
import { getAuctionStatusConfig, formatAuctionDateTime } from "../utils/auctionUtils";
import { AuctionState, AuctionType } from "../types/auction";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  ArrowRight, 
  Calendar, 
  Briefcase, 
  ShieldAlert,
  Loader2,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";

export const AuctionListView: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  
  // Fetch auctions using React Query
  const { data: auctions = [], isLoading, isError, error, refetch, isRefetching } = useAuctions();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Filter logic
  const filteredAuctions = auctions.filter((auc) => {
    const matchesSearch = 
      auc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auc.auctionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || auc.state === statusFilter;
    const matchesType = typeFilter === "ALL" || auc.auctionType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const canCreateAuction = hasPermission("auction.create");

  return (
    <div className="space-y-6 animate-fadeIn" id="auction-list-view-root">
      {/* 1. TOP STATS BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800/40">
        <div>
          <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold mb-1">AUCTBIZ Systems</p>
          <h2 className="text-xl font-bold font-mono text-white">AUCTION RECOGNITION REGISTRY</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time display of multi-tenant enterprise bidding campaigns and status transitions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Force refresh database"
            id="btn-refresh-auctions"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin text-indigo-400" : ""}`} />
          </button>
          {canCreateAuction && (
            <button
              onClick={() => navigate("/auctions/create")}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/15 cursor-pointer transition-all"
              id="btn-create-auction"
            >
              <Plus className="h-4 w-4" />
              <span>Draft New Campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SEARCH & FILTERS CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 font-mono text-xs">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by campaign title or ID (e.g., AUC-17...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
            id="auction-search-input"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            id="auction-status-filter"
          >
            <option value="ALL">ALL LIFECYCLE STATES</option>
            {Object.values(AuctionState).map((state) => (
              <option key={state} value={state}>
                STATUS: {state}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            id="auction-type-filter"
          >
            <option value="ALL">ALL CAMPAIGN TYPES</option>
            <option value={AuctionType.FORWARD}>FORWARD BIDDING</option>
            <option value={AuctionType.REVERSE}>REVERSE PROCURE</option>
          </select>
          <Filter className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800/40 rounded-2xl" id="auctions-loading-state">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-xs font-mono text-slate-400">CONNECTING TO SECURE TELEMETRY CHANNELS...</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center text-rose-400 font-mono text-xs space-y-3" id="auctions-error-state">
          <ShieldAlert className="h-10 w-10 mx-auto text-rose-500" />
          <p className="font-bold uppercase tracking-wider">Secure Connection Handshake Failed</p>
          <p className="text-slate-400">{error instanceof Error ? error.message : "Error establishing API pipeline"}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer text-rose-400"
          >
            Retry Connection Link
          </button>
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-12 text-center text-slate-400 font-mono text-xs space-y-4" id="auctions-empty-state">
          <Briefcase className="h-12 w-12 mx-auto text-slate-600" />
          <div>
            <p className="font-bold text-slate-300 uppercase tracking-widest">No Campaigns Located</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Adjust search parameters or initiate a new campaign draft from the command bar.
            </p>
          </div>
          {canCreateAuction && (
            <button
              onClick={() => navigate("/auctions/create")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow"
            >
              Draft First Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden" id="auctions-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase">
                  <th className="py-4 px-6">Campaign Identifier</th>
                  <th className="py-4 px-4">Title & Description</th>
                  <th className="py-4 px-4 text-center">Type</th>
                  <th className="py-4 px-4 text-center">State</th>
                  <th className="py-4 px-4 text-center">Lots</th>
                  <th className="py-4 px-4">Active Schedule</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs">
                {filteredAuctions.map((auc) => {
                  const statusConf = getAuctionStatusConfig(auc.state);
                  return (
                    <tr 
                      key={auc.id} 
                      className="hover:bg-slate-900/30 transition-colors"
                      id={`auction-row-${auc.id}`}
                    >
                      {/* Campaign ID */}
                      <td className="py-4 px-6 font-mono text-slate-400">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-300">{auc.auctionNumber}</span>
                          <span className="text-[9px] text-slate-600 truncate max-w-[120px]" title={auc.id}>
                            UUID: {auc.id.substring(0, 8)}...
                          </span>
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col max-w-sm">
                          <span className="font-semibold text-white truncate text-xs">{auc.title}</span>
                          <span className="text-[10px] text-slate-500 truncate mt-0.5">
                            {(auc as any).description || "No supplemental details provided."}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold font-mono tracking-wide ${
                          auc.auctionType === AuctionType.FORWARD 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {auc.auctionType === AuctionType.FORWARD ? "FORWARD" : "REVERSE"}
                        </span>
                      </td>

                      {/* State */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border font-mono tracking-wider inline-block ${statusConf.badgeClass}`}>
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Lots count */}
                      <td className="py-4 px-4 text-center font-mono">
                        <span className="text-slate-300 font-bold bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded">
                          {auc.lotCount}
                        </span>
                      </td>

                      {/* Schedule */}
                      <td className="py-4 px-4 text-slate-400 text-[10px] font-mono leading-relaxed">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-indigo-400" />
                          <span>Start: {formatAuctionDateTime(auc.auctionStart).substring(0, 17)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3 w-3 text-purple-400" />
                          <span>End: {formatAuctionDateTime(auc.auctionEnd).substring(0, 17)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => navigate(`/auctions/${auc.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-indigo-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer"
                          id={`btn-view-${auc.id}`}
                        >
                          <span>Review Sheet</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionListView;
