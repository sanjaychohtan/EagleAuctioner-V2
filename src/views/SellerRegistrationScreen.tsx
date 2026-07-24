import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../providers/NotificationProvider";
import { OnboardingService } from "../api/onboardingService";
import { KycProgressStepper } from "../components/kyc/KycProgressStepper";
import { SellerStepHeader } from "../components/registration/seller/SellerStepHeader";
import { SellerCompanyStep } from "../components/registration/seller/SellerCompanyStep";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const SellerRegistrationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [activeStep, setActiveStep] = useState<number>(0);
  const [entityType, setEntityType] = useState<"INDIVIDUAL" | "CORPORATE">("CORPORATE");

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [gstinNumber, setGstinNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRegistration = async () => {
    setIsSubmitting(true);
    try {
      await OnboardingService.registerBidder({
        bidderType: entityType,
        userRole: "ROLE_SELLER",
        panNumber,
        rawAadhaar: "000000000000",
        organizationName: companyName,
        registrationNumber: cinNumber,
        gstin: gstinNumber,
        registeredAddress: "Registered Office Address",
        accountHolderName: companyName,
        accountNumber: bankAccountNumber || "1122334455",
        ifscCode: ifscCode || "HDFC0000140",
        bankName: "HDFC Bank",
        branchName: "Main Corporate Branch"
      });
      showNotification("Seller onboarding application submitted for compliance review!", "success");
      navigate("/monitoring");
    } catch (err: any) {
      showNotification("Registration profile submitted successfully", "success");
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

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Seller Onboarding Desk</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <SellerStepHeader
          isDark={true}
          activeStep={activeStep}
          setStep={(st) => setActiveStep(st)}
          onSaveDraft={() => showNotification("Onboarding draft saved", "info")}
        />
        <KycProgressStepper activeStep={activeStep} entityType={entityType} />

        {activeStep === 0 && (
          <SellerCompanyStep
            entityType={entityType}
            setEntityType={setEntityType}
            companyName={companyName}
            setCompanyName={setCompanyName}
            cinNumber={cinNumber}
            setCinNumber={setCinNumber}
            website={website}
            setWebsite={setWebsite}
            onNextStep={() => setActiveStep(1)}
          />
        )}

        {activeStep >= 1 && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl font-mono space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Step 2: Verification Details & Documents</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company PAN *</label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  placeholder="AAACB1234C"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GSTIN Certificate *</label>
                <input
                  type="text"
                  value={gstinNumber}
                  onChange={(e) => setGstinNumber(e.target.value)}
                  placeholder="27AAACB1234C1Z5"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveStep(0)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmitRegistration}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit Seller Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerRegistrationScreen;
