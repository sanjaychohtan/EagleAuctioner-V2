import React, { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  BarChart2, 
  Activity, 
  Zap,
  ArrowRight,
  Cpu,
  Brain,
  ShieldCheck,
  RotateCw,
  TrendingDown,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIInsightsProps {
  themeMode: "light" | "dark";
  showToast: (msg: string, type: "success" | "info" | "warning") => void;
}

export function AIInsights({ themeMode, showToast }: AIInsightsProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<"insights" | "predictions" | "risks">("insights");

  // Mock AI generated insights database
  const [insights, setInsights] = useState([
    {
      id: "INS-1",
      category: "GMV Trend",
      title: "Metal Scrap Category Surging",
      desc: "Scrap copper & structural alloy lot indices have grown 14.8% over the past 48 hours. Recommend bringing forward state copper launches scheduled for next week.",
      score: "+14.8%",
      type: "growth",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: "INS-2",
      category: "Fraud Warning",
      title: "High Bid Velocity Detected",
      desc: "Lot #102 saw 12 bids within 18 seconds from two buyers with identical subnet IPs. Active DDoS & proxy mitigation shields have been throttled for these accounts.",
      score: "CRITICAL",
      type: "risk",
      icon: AlertTriangle,
      color: "text-red-500 bg-red-500/10 border-red-500/20"
    },
    {
      id: "INS-3",
      category: "Seller Performance",
      title: "JSW Steel Fulfilling 3h Ahead of SLA",
      desc: "Dual signature checker release times for JSW Salvage desk average 12 minutes, leading all enterprise sellers. System auto-granted an 'A++ Preferred status' tag.",
      score: "OPTIMIZED",
      type: "info",
      icon: ShieldCheck,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
    },
    {
      id: "INS-4",
      category: "Buyer Activity",
      title: "State Coal Escrow Caps Approaching",
      desc: "Coal block buyers have deposited ₹4.8 Cr today. System anticipates a floating liquidity deficit in the SBI Escrow Pool if current bids lock. Suggest EMD trigger alerts.",
      score: "92% CAP",
      type: "warning",
      icon: Info,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    }
  ]);

  const predictions = [
    { title: "Commission Revenue Q3", current: "₹88.45 Lakhs", projected: "₹1.12 Cr", confidence: "94% Match", direction: "up" },
    { title: "Aggregated Bid Concurrency", current: "842 clients", projected: "1,450 clients", confidence: "89% Match", direction: "up" },
    { title: "SLA Resolution Average", current: "12 mins", projected: "8.5 mins", confidence: "98% Match", direction: "down" },
    { title: "EMD Refund Processing Speed", current: "14 hrs", projected: "2.4 hrs", confidence: "92% Match", direction: "down" }
  ];

  const risks = [
    { lot: "Lot #402 (Steel Billets)", flag: "Maker Dual-Sign Hold", details: "Awaiting Finance Checker key verification. SLA breaching in 22 minutes.", severity: "high" },
    { lot: "Buyer #809 (Singhal Metals)", flag: "KYC Re-verification Req", details: "GSTIN tax filing registry reported mismatch on State API sync.", severity: "medium" },
    { lot: "System Latency", flag: "Database Pool Exhaustion", details: "Active Hikari connections peaked at 92/100 pools during peak bidding.", severity: "low" }
  ];

  const handleRecalculate = () => {
    setIsRecalculating(true);
    showToast("Re-indexing neural database logs...", "info");
    
    setTimeout(() => {
      setIsRecalculating(false);
      showToast("Cognitive AI Insights and predictive vectors rebuilt successfully.", "success");
      // Randomize insights order slightly for simulation
      setInsights(prev => [...prev].reverse());
    }, 2000);
  };

  return (
    <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
      themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
    }`}>
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800/85 pb-4 mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-500">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Gemini Neural Analytics</h4>
            <p className="text-[10px] text-slate-500 font-mono">Real-time risk warnings & projections</p>
          </div>
        </div>

        {/* RECALCULATE TRIGGER BUTTON */}
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
            isRecalculating 
              ? "border-slate-800 text-slate-500 bg-slate-950" 
              : "border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10"
          }`}
        >
          <RotateCw className={`h-3 w-3 ${isRecalculating ? "animate-spin" : ""}`} />
          {isRecalculating ? "Analyzing streams..." : "Rebuild Vectors"}
        </button>
      </div>

      {/* MINI TAB SWITCHER */}
      <div className="flex border-b border-slate-150 dark:border-slate-800/60 mb-4 gap-4 text-[10px] font-mono font-bold">
        <button
          onClick={() => setActiveTab("insights")}
          className={`pb-2 transition-all border-b-2 cursor-pointer ${
            activeTab === "insights" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          Operational Intelligence ({insights.length})
        </button>
        <button
          onClick={() => setActiveTab("predictions")}
          className={`pb-2 transition-all border-b-2 cursor-pointer ${
            activeTab === "predictions" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          Predictive Vectors ({predictions.length})
        </button>
        <button
          onClick={() => setActiveTab("risks")}
          className={`pb-2 transition-all border-b-2 cursor-pointer ${
            activeTab === "risks" ? "border-indigo-500 text-indigo-500" : "border-transparent text-slate-500 hover:text-slate-400"
          }`}
        >
          Risk Matrix ({risks.length})
        </button>
      </div>

      {/* CONTENT AREA */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (isRecalculating ? "-loading" : "-ready")}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="flex-1"
        >
          {isRecalculating ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Cpu className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-mono">Parsing relational schema buffers and training projections...</p>
            </div>
          ) : (
            <>
              {/* INSIGHTS LIST */}
              {activeTab === "insights" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {insights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex gap-3 transition-all ${
                          themeMode === "dark" 
                            ? "bg-slate-950/40 border-slate-850 hover:bg-slate-950" 
                            : "bg-slate-50 border-slate-150 hover:bg-slate-100/50"
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center border ${item.color}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-500">{item.category}</span>
                            <span className="text-[9px] font-mono font-extrabold text-indigo-500">{item.score}</span>
                          </div>
                          <h5 className={`text-[11px] font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>{item.title}</h5>
                          <p className="text-[10px] leading-relaxed text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PREDICTIONS VIEW */}
              {activeTab === "predictions" && (
                <div className="grid grid-cols-2 gap-3">
                  {predictions.map((pred, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex flex-col justify-between h-[100px] ${
                        themeMode === "dark" ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                        <span className="truncate">{pred.title}</span>
                        <span className="text-indigo-500 font-bold">{pred.confidence}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">Current</span>
                          <span className={`text-sm font-mono font-bold ${themeMode === "dark" ? "text-slate-300" : "text-slate-700"}`}>{pred.current}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-indigo-400 block font-mono">Projected</span>
                          <span className="text-sm font-mono font-extrabold text-indigo-500 block">{pred.projected}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RISKS MATRIX VIEW */}
              {activeTab === "risks" && (
                <div className="space-y-2">
                  {risks.map((risk, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        themeMode === "dark" ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${
                          risk.severity === "high" ? "bg-red-500/15 text-red-500" :
                          risk.severity === "medium" ? "bg-amber-500/15 text-amber-500" : "bg-blue-500/15 text-blue-500"
                        }`}>
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className={`font-mono text-[10px] font-bold block ${themeMode === "dark" ? "text-slate-200" : "text-slate-700"}`}>
                            {risk.lot}
                          </span>
                          <p className="text-[10px] text-slate-400 block mt-0.5">{risk.details}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                          risk.severity === "high" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          risk.severity === "medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}>
                          {risk.flag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* RECOMMENDATION FOOTER BANNER */}
      <div className={`mt-4 p-3 rounded-xl border border-dashed flex items-center justify-between gap-3 text-[10px] text-indigo-500 ${
        themeMode === "dark" ? "bg-indigo-950/10 border-indigo-500/20" : "bg-indigo-50/50 border-indigo-500/20"
      }`}>
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 animate-pulse" />
          <span><strong>Insight Action Plan:</strong> Route state timber bids through state clearing banks to optimize float.</span>
        </div>
        <button onClick={() => showToast("Insight plan queued for checker approval.", "info")} className="text-[9px] font-mono font-bold uppercase hover:underline flex items-center gap-0.5 cursor-pointer shrink-0">
          Apply <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
