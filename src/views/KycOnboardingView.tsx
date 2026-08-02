import React, { useState, useEffect } from "react";
import { useKycStore } from "../store/useKycStore";
import { useAppStore } from "../store/useAppStore";
import { RegistrationScreen } from "./RegistrationScreen";
import { RefreshCw, ShieldAlert, ArrowRight, User, Building, Landmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { USER_ROLE } from "../constants";

export const KycOnboardingView: React.FC = () => {
  const { user } = useAuth();
  const { profile, fetchProfile, isLoading } = useKycStore();
  const { themeMode } = useAppStore();
  const [selectedFlow, setSelectedFlow] = useState<"BUYER" | "SELLER" | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  // If a profile exists in backend state, auto-bind to that flow
  useEffect(() => {
    if (profile && user) {
      if (user.roles?.includes(USER_ROLE.BUYER)) {
        setSelectedFlow("BUYER");
      } else if (user.roles?.includes(USER_ROLE.SELLER)) {
        setSelectedFlow("SELLER");
      }
    }
  }, [profile, user]);

  if (isLoading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-4 font-mono text-xs ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>
        <RefreshCw className="h-8 w-8 text-blue-900 animate-spin" />
        <span className="tracking-wider uppercase">Fetching Compliance Dossier...</span>
      </div>
    );
  }

  // Render chosen flow
  if (selectedFlow === "BUYER") {
    return <RegistrationScreen role="BUYER" />;
  }

  if (selectedFlow === "SELLER") {
    return <RegistrationScreen role="SELLER" />;
  }

  const isDark = themeMode === "dark";

  // Render landing selector screen
  return (
    <div className={`space-y-8 max-w-5xl mx-auto pb-16 font-mono text-xs ${isDark ? "text-slate-300" : "text-slate-800"}`}>
      {/* Dynamic Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl relative overflow-hidden border ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-900 via-orange-500 to-emerald-500" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
            <h1 className={`text-lg font-bold uppercase tracking-tight ${isDark ? "text-white" : "text-blue-950"}`}>Compliance Registration Portal</h1>
          </div>
          <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Welcome, <span className={`font-bold ${isDark ? "text-slate-100" : "text-blue-900"}`}>{user?.username || "Trader"}</span>. Select your enterprise operational role to start identity and bank clearances.
          </p>
        </div>
      </div>

      {/* Two Choice Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BUYER CARD */}
        <div 
          onClick={() => setSelectedFlow("BUYER")}
          className={`group border p-6 rounded-2xl flex flex-col justify-between gap-8 cursor-pointer transition-all hover:shadow-xl relative overflow-hidden ${
            isDark 
              ? "bg-slate-900 hover:bg-slate-900/80 border-slate-800 hover:border-blue-500 hover:shadow-blue-500/5" 
              : "bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-900 hover:shadow-blue-900/5"
          }`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
            <User className="h-32 w-32 text-blue-900" />
          </div>

          <div className="space-y-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/25" : "bg-blue-50 text-blue-900 border-blue-200"
            }`}>
              <User className="h-5 w-5" />
            </div>

            <div className="space-y-1.5">
              <h2 className={`text-sm font-bold uppercase tracking-wider transition-all ${
                isDark ? "text-slate-100 group-hover:text-blue-450" : "text-blue-950 group-hover:text-blue-900"
              }`}>
                Onboard as Platform Buyer
              </h2>
              <p className={`text-[10px] leading-relaxed font-normal ${isDark ? "text-slate-500" : "text-slate-600"}`}>
                Establish buying limits, register Aadhaar/PAN tax profiles, and link escrow clearance bank routing vectors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-orange-500 font-bold text-[10px] uppercase tracking-wider">
            <span>Launch Buyer Registration</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* SELLER CARD */}
        <div 
          onClick={() => setSelectedFlow("SELLER")}
          className={`group border p-6 rounded-2xl flex flex-col justify-between gap-8 cursor-pointer transition-all hover:shadow-xl relative overflow-hidden ${
            isDark 
              ? "bg-slate-900 hover:bg-slate-900/80 border-slate-800 hover:border-blue-500 hover:shadow-blue-500/5" 
              : "bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-900 hover:shadow-blue-900/5"
          }`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
            <Building className="h-32 w-32 text-blue-900" />
          </div>

          <div className="space-y-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/25" : "bg-blue-50 text-blue-900 border-blue-200"
            }`}>
              <Building className="h-5 w-5" />
            </div>

            <div className="space-y-1.5">
              <h2 className={`text-sm font-bold uppercase tracking-wider transition-all ${
                isDark ? "text-slate-100 group-hover:text-blue-450" : "text-blue-950 group-hover:text-blue-900"
              }`}>
                Onboard as Platform Seller
              </h2>
              <p className={`text-[10px] leading-relaxed font-normal ${isDark ? "text-slate-500" : "text-slate-600"}`}>
                Configure corporate supplier details, list auction lots, enter MCA CIN certifications, and link settlement accounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-orange-500 font-bold text-[10px] uppercase tracking-wider">
            <span>Launch Seller Registration</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Compliance Information Card */}
      <div className={`border p-6 rounded-2xl space-y-4 ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${
          isDark ? "text-white border-slate-800" : "text-blue-950 border-slate-100"
        }`}>
          <Landmark className="h-4 w-4 text-emerald-500" />
          Enterprise Compliance Guardrails
        </h3>
        <p className={`text-[10px] leading-relaxed font-normal ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          In compliance with Reserve Bank guidelines on high-volume trading and metallic auctions, all accounts must clear active pan identity logs and penny-drop escrow validations. Standard SLA turnaround time is under 4 business hours.
        </p>
      </div>
    </div>
  );
};

export default KycOnboardingView;
