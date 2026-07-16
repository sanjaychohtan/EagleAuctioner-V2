import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";

export const UnauthorizedView: React.FC = () => {
  const navigate = useNavigate();

  const handleReturn = () => {
    navigate("/monitoring");
  };

  const handleReauth = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300 animate-fadeIn">
      <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        {/* SECURE AMBER HIGHLIGHT */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

        <div className="h-14 w-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-white tracking-tight font-mono uppercase">Authorization Refused</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your active JWT session does not possess the required RBAC authority scopes configured for this segment layout.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleReturn}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Observability Hub</span>
          </button>

          <button
            onClick={handleReauth}
            className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-slate-200 font-semibold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
          >
            <RefreshCw className="h-4 w-4 text-amber-500" />
            <span>Authorize Different Operator</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          Audit Reference: ERR_RBAC_REJECTED_403
        </div>
      </div>
    </div>
  );
};
export default UnauthorizedView;
