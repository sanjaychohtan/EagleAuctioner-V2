import React, { memo } from "react";
import { KycProgressStepper } from "../../kyc/KycProgressStepper";
import { ShieldCheck, Save } from "lucide-react";

interface SellerStepHeaderProps {
  isDark: boolean;
  activeStep: number;
  setStep: (step: number) => void;
  onSaveDraft: () => void;
}

export const SellerStepHeader: React.FC<SellerStepHeaderProps> = memo(({
  isDark,
  activeStep,
  setStep,
  onSaveDraft
}) => {
  return (
    <div className={`p-6 rounded-3xl border shadow-xl ${
      isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400">
              Verified Enterprise Onboarding
            </span>
            <h1 className={`text-xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
              Seller Registration Portal
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={onSaveDraft}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border flex items-center gap-2 transition-all cursor-pointer ${
            isDark 
              ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" 
              : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Save className="h-4 w-4 text-blue-400" />
          <span>Save Draft Progress</span>
        </button>
      </div>

      <KycProgressStepper activeStep={activeStep} entityType="CORPORATE" />
    </div>
  );
});

SellerStepHeader.displayName = "SellerStepHeader";
