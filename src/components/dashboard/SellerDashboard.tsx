import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  PlusCircle, 
  FileText, 
  Coins, 
  Calendar, 
  FileCheck,
  TrendingUp,
  Tag,
  Eye,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSellerDashboard } from "../../hooks/useDashboardQueries";

interface SellerDashboardProps {
  simulationMode: "normal" | "loading" | "empty" | "error";
  themeMode: "light" | "dark";
  onTriggerAction: (actionName: string, payload?: any) => void;
}

export function SellerDashboard({
  simulationMode,
  themeMode,
  onTriggerAction
}: SellerDashboardProps) {
  const [lotTitle, setLotTitle] = useState("");
  const [lotPrice, setLotPrice] = useState("");
  const [lotCategory, setLotCategory] = useState("Metals");
  const [lotIncrement, setLotIncrement] = useState("");

  const { data: dashboardData, isLoading, isError } = useSellerDashboard();
  const listings = dashboardData?.recentAuctions || [];
  const totalRevenue = dashboardData?.totalRevenue || 0;

  const handleCreateLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotTitle || !lotPrice || !lotIncrement) return;
    const newId = `LOT-${Math.floor(100 + Math.random() * 900)}`;
    onTriggerAction("create-lot", { id: newId, title: lotTitle, price: lotPrice });
    setLotTitle("");
    setLotPrice("");
    setLotIncrement("");
  };

  const handleDeleteLot = (id: string, name: string) => {
    onTriggerAction("delete-lot", { id, name });
  };

  if (isError || simulationMode === "error") {
    return (
      <div className={`p-6 rounded-2xl ${themeMode === "dark" ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-600"}`}>
        <AlertCircle className="h-6 w-6 mb-2" />
        <h3 className="text-lg font-medium">Failed to load seller dashboard</h3>
      </div>
    );
  }

  if (isLoading || simulationMode === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`p-5 rounded-xl border h-28 ${themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
          ))}
        </div>
        <div className={`p-6 rounded-2xl border h-[300px] ${themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. SELLER PORTFOLIO PORTRAIT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">My Listings Active</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              {listings.length} Lots
            </div>
            <span className="text-[8px] font-mono text-emerald-400 block">{listings.filter(l => l.status === "live").length} Live taking bids</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
            <Tag className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Aggregate Sales GMV</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              ₹{(totalRevenue / 10000000).toFixed(2)} Cr
            </div>
            <span className="text-[8px] font-mono text-emerald-400 block">Average conversion: 100%</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Pending Approvals</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              {listings.filter(l => l.status === "pending_approval").length} Queue
            </div>
            <span className="text-[8px] font-mono text-amber-500 block">Review target: under 15m</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
            <Eye className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 2. CORE WORKSPACE: CREATE FORM & LISTINGS TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* QUICK PUBLISH FORM (5 cols) */}
        <div className={`lg:col-span-5 p-6 rounded-2xl border shadow-sm ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold border-b pb-3 mb-4 ${
            themeMode === "dark" ? "text-slate-400" : "text-slate-500"
          }`}>
            Publish Industrial Lot
          </h3>

          <form onSubmit={handleCreateLot} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-500 block">Lot Specification Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Copper Scrap Cathodes 50 MT"
                value={lotTitle}
                onChange={e => setLotTitle(e.target.value)}
                className={`w-full bg-transparent border rounded-lg px-3 py-2 text-xs outline-none ${
                  themeMode === "dark" ? "border-slate-800 focus:border-blue-500 text-white" : "border-slate-200 focus:border-blue-600 text-slate-900"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-500 block">Start Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="1000000"
                  value={lotPrice}
                  onChange={e => setLotPrice(e.target.value)}
                  className={`w-full bg-transparent border rounded-lg px-3 py-2 text-xs outline-none ${
                    themeMode === "dark" ? "border-slate-800 focus:border-blue-500 text-white" : "border-slate-200 focus:border-blue-600 text-slate-900"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-500 block">Min Increment (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="25000"
                  value={lotIncrement}
                  onChange={e => setLotIncrement(e.target.value)}
                  className={`w-full bg-transparent border rounded-lg px-3 py-2 text-xs outline-none ${
                    themeMode === "dark" ? "border-slate-800 focus:border-blue-500 text-white" : "border-slate-200 focus:border-blue-600 text-slate-900"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-500 block">Category Mappings</label>
              <select
                value={lotCategory}
                onChange={e => setLotCategory(e.target.value)}
                className={`w-full bg-transparent border rounded-lg px-3 py-2 text-xs outline-none ${
                  themeMode === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                <option value="Metals">Metals & Ores</option>
                <option value="Energy">Energy & Coal</option>
                <option value="Chemicals">Solvents & Chemicals</option>
                <option value="Salvage">Commercial Salvage</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Plus className="h-4.5 w-4.5" /> Publish for Review
            </button>
          </form>
        </div>

        {/* ACTIVE LISTINGS TABLE (7 cols) */}
        <div className={`lg:col-span-7 p-6 rounded-2xl border shadow-sm ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold border-b pb-3 mb-4 ${
            themeMode === "dark" ? "text-slate-400" : "text-slate-500"
          }`}>
            Lot Portfolio Registers
          </h3>

          <div className="space-y-3.5">
            {listings.map((lot) => {
              const isLive = lot.status === "live";

              return (
                <div 
                  key={lot.id} 
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 text-xs relative ${
                    themeMode === "dark" ? "bg-slate-950/30 border-slate-850" : "bg-slate-50 border-slate-150"
                  }`}
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{lot.id}</span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.2 rounded-full ${
                        isLive ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {lot.status.replace("_", " ")}
                      </span>
                    </div>
                    <span className={`font-semibold block truncate ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
                      {lot.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Reserve: ₹{lot.startPrice.toLocaleString()} • Current Highest: ₹{lot.currentBid.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono text-[10px]">
                      <span className="text-slate-400 block">{lot.bids} bids received</span>
                      <span className="text-emerald-500 font-bold block">{lot.slaState.toUpperCase()} SLA</span>
                    </div>

                    <button 
                      onClick={() => handleDeleteLot(lot.id, lot.title)}
                      className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                      title="Withdraw/Delete Lot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
