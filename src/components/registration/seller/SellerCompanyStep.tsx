import React, { memo } from "react";
import { Building2, Globe, MapPin, Hash } from "lucide-react";

interface SellerCompanyStepProps {
  entityType: "INDIVIDUAL" | "CORPORATE";
  setEntityType: (type: "INDIVIDUAL" | "CORPORATE") => void;
  companyName: string;
  setCompanyName: (val: string) => void;
  cinNumber: string;
  setCinNumber: (val: string) => void;
  website: string;
  setWebsite: (val: string) => void;
  onNextStep: () => void;
}

export const SellerCompanyStep: React.FC<SellerCompanyStepProps> = memo(({
  entityType,
  setEntityType,
  companyName,
  setCompanyName,
  cinNumber,
  setCinNumber,
  website,
  setWebsite,
  onNextStep
}) => {
  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl font-mono space-y-5 text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-400" />
          Step 1: Entity Structure & Business Profile
        </h3>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Entity Category</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setEntityType("CORPORATE")}
            className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
              entityType === "CORPORATE" ? "bg-blue-600/10 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <div className="text-xs">Corporate / Private Limited</div>
            <div className="text-[10px] text-slate-500 font-normal">CIN & GSTIN Mandatory</div>
          </button>
          <button
            type="button"
            onClick={() => setEntityType("INDIVIDUAL")}
            className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
              entityType === "INDIVIDUAL" ? "bg-blue-600/10 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <div className="text-xs">Proprietorship / Individual</div>
            <div className="text-[10px] text-slate-500 font-normal">Sole Proprietor PAN</div>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Registered Legal Entity Name *
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Industrial Metal Recycling Pvt Ltd"
            required
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-blue-500"
          />
        </div>

        {entityType === "CORPORATE" && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Corporate Identification Number (CIN) *
            </label>
            <input
              type="text"
              value={cinNumber}
              onChange={(e) => setCinNumber(e.target.value)}
              placeholder="U12345MH2020PTC123456"
              required
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Official Corporate Website
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.acme-metals.com"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onNextStep}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
        >
          Continue to Contact Info
        </button>
      </div>
    </div>
  );
});

SellerCompanyStep.displayName = "SellerCompanyStep";
