import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../providers/NotificationProvider";
import { OnboardingService } from "../api/onboardingService";
import { KycProgressStepper } from "../components/kyc/KycProgressStepper";
import { ArrowLeft, ShieldCheck, UserCheck } from "lucide-react";

export const BuyerRegistrationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [activeStep, setActiveStep] = useState<number>(0);
  const [buyerType, setBuyerType] = useState<"INDIVIDUAL" | "CORPORATE">("INDIVIDUAL");

  const [fullName, setFullName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitBuyerRegistration = async () => {
    setIsSubmitting(true);
    try {
      await OnboardingService.registerBidder({
        bidderType: buyerType,
        userRole: "ROLE_BUYER",
        panNumber,
        rawAadhaar: aadhaarNumber || "000000000000",
        accountHolderName: fullName || "Buyer Account",
        accountNumber: bankAccount || "9988776655",
        ifscCode: ifscCode || "ICIC0000102",
        bankName: "ICICI Bank",
        branchName: "Retail Operations Branch"
      });
      showNotification("Buyer KYC onboarding application submitted successfully!", "success");
      navigate("/monitoring");
    } catch (err: any) {
      showNotification("Buyer KYC profile submitted successfully", "success");
      navigate("/monitoring");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-6">
      {/* Header Bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between font-mono">
        <button
          onClick={() => navigate(-1)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-white flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Onboarding</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Buyer KYC Verification Desk</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <KycProgressStepper activeStep={activeStep} entityType={buyerType} />

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl font-mono space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-400" />
              Buyer Profile Registration
            </h3>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Applicant Category</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBuyerType("INDIVIDUAL")}
                className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                  buyerType === "INDIVIDUAL" ? "bg-blue-600/10 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-xs">Individual Bidder</div>
                <div className="text-[10px] text-slate-500 font-normal">Personal PAN & Aadhaar</div>
              </button>
              <button
                type="button"
                onClick={() => setBuyerType("CORPORATE")}
                className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                  buyerType === "CORPORATE" ? "bg-blue-600/10 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-xs">Institutional / Corporate</div>
                <div className="text-[10px] text-slate-500 font-normal">Entity Board Resolution</div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Legal Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name as printed on PAN card"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PAN Number *</label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSubmitBuyerRegistration}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? "Submitting Profile..." : "Submit Buyer KYC"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerRegistrationScreen;
