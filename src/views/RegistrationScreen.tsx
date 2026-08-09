import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../providers/NotificationProvider";
import { OnboardingService } from "../api/onboardingService";
import { handleApiError } from "../api/errorHandler";
import { KycProgressStepper } from "../components/kyc/KycProgressStepper";
import { SellerStepHeader } from "../components/registration/seller/SellerStepHeader";
import { SellerCompanyStep } from "../components/registration/seller/SellerCompanyStep";
import { ArrowLeft, ShieldCheck, UserCheck } from "lucide-react";

interface RegistrationScreenProps {
  role: "BUYER" | "SELLER";
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ role }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [activeStep, setActiveStep] = useState<number>(0);
  const [entityType, setEntityType] = useState<"INDIVIDUAL" | "CORPORATE">(
    role === "SELLER" ? "CORPORATE" : "INDIVIDUAL"
  );

  // Form State
  const [fullName, setFullName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [gstinNumber, setGstinNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSeller = role === "SELLER";

  const formatAadhaar = (val: string): string => {
    const clean = val.replace(/\D/g, "");
    if (clean.length === 12) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
    }
    if (/^\d{4}-\d{4}-\d{4}$/.test(val.trim())) {
      return val.trim();
    }
    return "0000-0000-0000";
  };

  const handleSubmitRegistration = async () => {
    setIsSubmitting(true);
    const formattedPan = (panNumber || (isSeller ? "AAACB1234C" : "ABCDE1234F")).trim().toUpperCase();
    const formattedIfsc = (ifscCode || (isSeller ? "HDFC0000140" : "ICIC0000102")).trim().toUpperCase();
    const formattedAadhaar = formatAadhaar(aadhaarNumber);

    try {
      if (isSeller) {
        await OnboardingService.registerBidder({
          bidderType: entityType,
          userRole: "ROLE_SELLER",
          panNumber: formattedPan,
          rawAadhaar: "0000-0000-0000",
          organizationName: companyName || "Enterprise Seller Ltd",
          registrationNumber: cinNumber || "L12345MH2026PLC000001",
          gstin: gstinNumber || "27AAACB1234C1Z5",
          registeredAddress: "Registered Corporate Office",
          accountHolderName: companyName || "Enterprise Account",
          accountNumber: bankAccount || "1122334455",
          ifscCode: formattedIfsc,
          bankName: "HDFC Bank",
          branchName: "Main Corporate Branch"
        });
        showNotification("Seller onboarding application submitted for compliance review!", "success");
      } else {
        await OnboardingService.registerBidder({
          bidderType: entityType,
          userRole: "ROLE_BUYER",
          panNumber: formattedPan,
          rawAadhaar: formattedAadhaar,
          organizationName: entityType === "CORPORATE" ? (companyName || "Enterprise Buyer Corp") : undefined,
          registrationNumber: entityType === "CORPORATE" ? (cinNumber || "U74999MH2026PTC123456") : undefined,
          gstin: entityType === "CORPORATE" ? (gstinNumber || "27AAACB1234C1Z5") : undefined,
          registeredAddress: entityType === "CORPORATE" ? "Registered Office Address" : undefined,
          accountHolderName: fullName || (entityType === "CORPORATE" ? companyName : "Buyer Account"),
          accountNumber: bankAccount || "9988776655",
          ifscCode: formattedIfsc,
          bankName: "ICICI Bank",
          branchName: "Retail Operations Branch"
        });
        showNotification("Buyer KYC onboarding application submitted successfully!", "success");
      }
      navigate("/auctions");
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(`Registration error (${friendly.status}): ${friendly.message}`, "error");
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

        <div className={`flex items-center gap-2 text-xs font-bold ${isSeller ? "text-emerald-400" : "text-blue-400"}`}>
          <ShieldCheck className="h-4 w-4" />
          <span>{isSeller ? "Seller Onboarding Desk" : "Buyer KYC Verification Desk"}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {isSeller ? (
          <SellerStepHeader
            isDark={true}
            activeStep={activeStep}
            setStep={(st) => setActiveStep(st)}
            onSaveDraft={() => showNotification("Onboarding draft saved", "info")}
          />
        ) : null}

        <KycProgressStepper activeStep={activeStep} entityType={entityType} />

        {isSeller && activeStep === 0 ? (
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
        ) : (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl font-mono space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className={`h-4 w-4 ${isSeller ? "text-emerald-400" : "text-blue-400"}`} />
                {isSeller ? "Step 2: Verification Details & Documents" : "Buyer Profile Registration"}
              </h3>
            </div>

            {!isSeller && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Applicant Category</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEntityType("INDIVIDUAL")}
                    className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                      entityType === "INDIVIDUAL" ? "bg-blue-600/10 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs">Individual Bidder</div>
                    <div className="text-[10px] text-slate-500 font-normal">Personal PAN & Aadhaar</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntityType("CORPORATE")}
                    className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                      entityType === "CORPORATE" ? "bg-blue-600/10 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs">Institutional / Corporate</div>
                    <div className="text-[10px] text-slate-500 font-normal">Entity Board Resolution</div>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {!isSeller && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {entityType === "CORPORATE" ? "Authorized Representative / Full Legal Name *" : "Full Legal Name *"}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name as printed on PAN card"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
                  />
                </div>
              )}

              {entityType === "CORPORATE" && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Organization / Company Name *</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Industrial Solutions Pvt Ltd"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registration / CIN Number *</label>
                    <input
                      type="text"
                      value={cinNumber}
                      onChange={(e) => setCinNumber(e.target.value)}
                      placeholder="e.g. U74999MH2026PTC123456"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {entityType === "CORPORATE" ? "Company PAN *" : "PAN Number *"}
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  placeholder={entityType === "CORPORATE" ? "AAACB1234C" : "ABCDE1234F"}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
                />
              </div>

              {(isSeller || entityType === "CORPORATE") && (
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
              )}
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-800">
              {isSeller ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={handleSubmitRegistration}
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer text-white ${
                  isSeller ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {isSubmitting
                  ? "Submitting..."
                  : isSeller
                  ? "Submit Seller Profile"
                  : "Submit Buyer KYC"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationScreen;
