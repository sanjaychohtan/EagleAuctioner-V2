import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../providers/NotificationProvider";
import { OnboardingService } from "../api/onboardingService";
import { handleApiError } from "../api/errorHandler";
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Lock, Mail, Phone, Landmark, Building, 
  FileText, CheckCircle2, AlertCircle, Upload, Check, CreditCard, Sparkles, SkipForward 
} from "lucide-react";

// STATE-CITY DYNAMIC DATA MAP
const INDIAN_STATES_CITIES: Record<string, string[]> = {
  Rajasthan: ["Jaipur", "Jodhpur", "Kota", "Udaipur", "Ajmer", "Bikaner", "Bhilwara", "Alwar"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar"],
  Delhi: ["New Delhi", "North Delhi", "South Delhi", "West Delhi", "East Delhi"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Davangere"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Uttar Pradesh": ["Noida", "Lucknow", "Kanpur", "Agra", "Varanasi", "Ghaziabad", "Meerut"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"],
};

export type AccountType = 
  | "PERSONAL" 
  | "PROPRIETORSHIP" 
  | "PARTNERSHIP" 
  | "PRIVATE_LIMITED" 
  | "PUBLIC_LIMITED" 
  | "LLP" 
  | "OTHER";

interface DocumentUploadState {
  documentType: string;
  label: string;
  documentNumber: string;
  file: File | null;
  uploaded: boolean;
}

interface RegistrationScreenProps {
  role?: "BUYER" | "SELLER";
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ role }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (role === "SELLER") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 font-mono">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Building className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Seller Access Control</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Public Seller self-registration is disabled. Seller account access is provided directly by AUCTBIZ enterprise operations.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => navigate("/onboarding?role=BUYER")}
              className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Continue as Bidder / Buyer
            </button>
            <button
              onClick={() => navigate("/login")}
              className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }
  const { showNotification } = useNotification();

  const [activeStep, setActiveStep] = useState<number>(1);
  const isPublicSignup = !user;

  // STEP 1 STATE
  const [applicantName, setApplicantName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("PERSONAL");
  const [selectedState, setSelectedState] = useState("Rajasthan");
  const [selectedCity, setSelectedCity] = useState("Jaipur");

  // Account Credentials for public signup
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // STEP 2 STATE: DYNAMIC DOCUMENTS
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [gstinNumber, setGstinNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");

  const [docUploads, setDocUploads] = useState<Record<string, DocumentUploadState>>({});

  // STEP 3 STATE: BANK DETAILS (OPTIONAL)
  const [skipBank, setSkipBank] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [chequeFile, setChequeFile] = useState<File | null>(null);

  // STEP 4 STATE: ACCOUNT PLAN & PAYMENT
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PAID">("FREE");
  const [paymentAmount, setPaymentAmount] = useState("2500");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "NEFT" | "RTGS" | "IMPS">("UPI");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  // SUBMISSION STATE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedTempId, setSubmittedTempId] = useState<string | null>(null);

  // Cities dynamically depend on state
  const availableCities = useMemo(() => {
    return INDIAN_STATES_CITIES[selectedState] || ["Central"];
  }, [selectedState]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const cities = INDIAN_STATES_CITIES[state] || ["Central"];
    setSelectedCity(cities[0]);
  };

  const formatAadhaarInput = (val: string): string => {
    const clean = val.replace(/\D/g, "").slice(0, 12);
    const parts = [];
    for (let i = 0; i < clean.length; i += 4) {
      parts.push(clean.slice(i, i + 4));
    }
    return parts.join("-");
  };

  // Compute required document types based on Account Type
  const requiredDocSpecs = useMemo(() => {
    switch (accountType) {
      case "PERSONAL":
        return [
          { type: "PAN_CARD", label: "Applicant PAN Card *" },
          { type: "AADHAAR_CARD", label: "Aadhaar Card (Front/Back) *" },
        ];
      case "PROPRIETORSHIP":
        return [
          { type: "PAN_CARD", label: "Proprietorship / Owner PAN *" },
          { type: "GST_CERTIFICATE", label: "GST Certificate (If Applicable)" },
          { type: "BUSINESS_PROOF", label: "Shop Establishment / Business Proof *" },
          { type: "PROPRIETOR_KYC", label: "Proprietor Aadhaar / Photo ID *" },
        ];
      case "PARTNERSHIP":
        return [
          { type: "PAN_CARD", label: "Partnership Firm PAN *" },
          { type: "PARTNERSHIP_DEED", label: "Registered Partnership Deed *" },
          { type: "GST_CERTIFICATE", label: "GST Registration Certificate *" },
          { type: "AUTHORIZED_KYC", label: "Authorized Partner KYC & Letter *" },
        ];
      case "PRIVATE_LIMITED":
      case "PUBLIC_LIMITED":
        return [
          { type: "PAN_CARD", label: "Company PAN Card *" },
          { type: "GST_CERTIFICATE", label: "GST Registration Certificate *" },
          { type: "INCORPORATION_CERT", label: "Certificate of Incorporation (COI) *" },
          { type: "BOARD_RESOLUTION", label: "Board Resolution & Authorized Person KYC *" },
        ];
      case "LLP":
        return [
          { type: "PAN_CARD", label: "LLP PAN Card *" },
          { type: "INCORPORATION_CERT", label: "LLP Incorporation Certificate *" },
          { type: "LLP_AGREEMENT", label: "LLP Agreement *" },
          { type: "AUTHORIZED_KYC", label: "Designated Partner Authorization & KYC *" },
        ];
      default:
        return [
          { type: "PAN_CARD", label: "Business / Personal PAN Card *" },
          { type: "BUSINESS_PROOF", label: "Business Entity Proof *" },
          { type: "AUTHORIZED_KYC", label: "Authorized Signatory KYC *" },
        ];
    }
  }, [accountType]);

  const handleFileUploadMock = (docType: string, file: File) => {
    setDocUploads((prev) => ({
      ...prev,
      [docType]: {
        documentType: docType,
        label: docType,
        documentNumber: prev[docType]?.documentNumber || "",
        file,
        uploaded: true,
      },
    }));
  };

  const validateStep1 = (): boolean => {
    setValidationError(null);
    if (!applicantName.trim()) {
      setValidationError("Applicant / Contact Person Name is required.");
      return false;
    }
    if (accountType !== "PERSONAL" && !companyName.trim()) {
      setValidationError("Company / Business Name is required for business accounts.");
      return false;
    }

    if (isPublicSignup) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setValidationError("Please enter a valid corporate email address.");
        return false;
      }
      if (!mobile.trim() || !/^\+?[1-9]\d{9,14}$/.test(mobile.trim())) {
        setValidationError("Please enter a valid mobile number (10-15 digits).");
        return false;
      }
      if (!password) {
        setValidationError("Password is required.");
        return false;
      }
      const passRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/;
      if (!passRegex.test(password)) {
        setValidationError("Password must be at least 8 characters long and contain 1 uppercase, 1 lowercase, 1 digit, and 1 special character.");
        return false;
      }
      if (password !== confirmPassword) {
        setValidationError("Password and Confirm Password do not match.");
        return false;
      }
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setValidationError(null);
    if (!panNumber.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase())) {
      setValidationError("Invalid PAN format (e.g., ABCDE1234F).");
      return false;
    }
    if (accountType === "PERSONAL") {
      const cleanAadhaar = aadhaarNumber.replace(/-/g, "");
      if (!cleanAadhaar || cleanAadhaar.length !== 12) {
        setValidationError("Aadhaar Number must be exactly 12 digits.");
        return false;
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    setValidationError(null);
    if (skipBank) return true;

    if (accountNumber.trim()) {
      if (!ifscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase())) {
        setValidationError("Invalid IFSC Code format (e.g. SBIN0001234).");
        return false;
      }
    }
    return true;
  };

  const validateStep4 = (): boolean => {
    setValidationError(null);
    if (selectedPlan === "PAID") {
      if (!paymentReference.trim()) {
        setValidationError("Payment Reference / UTR Number is required for Paid Account.");
        return false;
      }
      if (!paymentProofFile) {
        setValidationError("Payment Screenshot / Receipt upload is mandatory for Paid Account.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 1 && validateStep1()) setActiveStep(2);
    else if (activeStep === 2 && validateStep2()) setActiveStep(3);
    else if (activeStep === 3 && validateStep3()) setActiveStep(4);
  };

  const handleSubmitApplication = async () => {
    if (!validateStep4()) return;

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const registrationPayload = {
        accountType,
        applicantName,
        companyName: companyName || applicantName,
        panNumber: panNumber.toUpperCase(),
        rawAadhaar: aadhaarNumber.replace(/-/g, ""),
        stateName: selectedState,
        cityName: selectedCity,
        organizationName: companyName || applicantName + " Business",
        registrationNumber: registrationNumber || undefined,
        gstin: gstinNumber || undefined,
        registeredAddress: registeredAddress || `${selectedCity}, ${selectedState}`,
        accountHolderName: skipBank ? undefined : (accountHolderName || applicantName),
        accountNumber: skipBank ? undefined : accountNumber,
        ifscCode: skipBank ? undefined : ifscCode.toUpperCase(),
        bankName: skipBank ? undefined : bankName,
        branchName: skipBank ? undefined : branchName,
        planType: selectedPlan,
        paymentAmount: selectedPlan === "PAID" ? parseFloat(paymentAmount) : 0,
        paymentDate: selectedPlan === "PAID" ? paymentDate : undefined,
        paymentReference: selectedPlan === "PAID" ? paymentReference : undefined,
        paymentMode: selectedPlan === "PAID" ? paymentMode : undefined,
        paymentProofUrl: selectedPlan === "PAID" ? "/uploads/receipts/proof_" + Date.now() + ".png" : undefined,
      };

      if (isPublicSignup) {
        const response = await OnboardingService.registerPublicBidder({
          email,
          mobile,
          password,
          bidderDetails: registrationPayload as any,
        });

        const tempId = response?.data?.user?.tempCustomerId || response?.data?.tempCustomerId || "TMP-2026-" + Math.floor(100000 + Math.random() * 900000);
        setSubmittedTempId(tempId);
      } else {
        const response = await OnboardingService.registerBidder(registrationPayload as any);
        setSubmittedTempId(response.tempCustomerId || "TMP-2026-" + Math.floor(100000 + Math.random() * 900000));
      }

      showNotification("Application submitted successfully!", "success");
    } catch (err: any) {
      const friendly = handleApiError(err);
      setValidationError(friendly.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS TEMPORARY CUSTOMER VIEW
  if (submittedTempId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-wide">Registration Application Submitted</h2>
            <p className="text-xs text-slate-400">
              Your application is currently under internal compliance & KYC verification.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 font-mono space-y-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">
              Temporary Customer Identity
            </span>
            <div className="text-2xl font-extrabold text-blue-400 tracking-wider">
              {submittedTempId}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Status: PENDING APPROVAL</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs text-left leading-relaxed space-y-2 font-mono">
            <div className="flex items-center gap-2 font-bold text-blue-200">
              <ShieldCheck className="h-4 w-4" />
              <span>Next Verification Lifecycle</span>
            </div>
            <p>
              1. Our operations team will review your submitted KYC documents and account plan.
            </p>
            <p>
              2. Upon final approval, your <strong>Permanent Customer ID</strong> and <strong>Bidder ID</strong> will be generated.
            </p>
            <p>
              3. You will receive active bidding access across all eligible AUCTBIZ industrial auctions.
            </p>
          </div>

          <div className="pt-2 flex gap-4 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (activeStep > 1 ? setActiveStep(activeStep - 1) : navigate("/login"))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-wider text-white font-mono uppercase">AUCTBIZ BIDDER REGISTRATION</h1>
              <p className="text-[11px] text-blue-400 font-bold uppercase tracking-widest">WHERE INDUSTRY MEETS OPPORTUNITY</p>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400 font-bold">
            STEP <span className="text-blue-400">{activeStep}</span> OF 4
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="grid grid-cols-4 gap-3 font-mono text-xs">
          {[
            { step: 1, title: "1. Primary Details" },
            { step: 2, title: "2. Dynamic KYC" },
            { step: 3, title: "3. Bank Details" },
            { step: 4, title: "4. Account Plan" },
          ].map((item) => (
            <div
              key={item.step}
              className={`p-3 rounded-2xl border text-center transition-all ${
                activeStep === item.step
                  ? "bg-blue-600/10 border-blue-500 text-blue-400 font-bold"
                  : activeStep > item.step
                  ? "bg-slate-900 border-emerald-500/40 text-emerald-400 font-bold"
                  : "bg-slate-950 border-slate-800 text-slate-500"
              }`}
            >
              {item.title}
            </div>
          ))}
        </div>

        {validationError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 font-mono">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1: BASIC / PRIMARY DETAILS */}
        {activeStep === 1 && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-400" />
              <span>Step 1 — Basic & Primary Applicant Details</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">
                  Applicant / Contact Person Name *
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Sanjay Maloo"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">
                  Account Type *
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                >
                  <option value="PERSONAL">PERSONAL</option>
                  <option value="PROPRIETORSHIP">PROPRIETORSHIP</option>
                  <option value="PARTNERSHIP">PARTNERSHIP</option>
                  <option value="PRIVATE_LIMITED">PRIVATE LIMITED</option>
                  <option value="PUBLIC_LIMITED">PUBLIC LIMITED</option>
                  <option value="LLP">LLP</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {accountType !== "PERSONAL" && (
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-400 uppercase mb-1">
                    Company / Business Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. ABC Traders Private Limited"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">State *</label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                >
                  {Object.keys(INDIAN_STATES_CITIES).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">City * (Dynamic)</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                >
                  {availableCities.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>

              {isPublicSignup && (
                <>
                  <div className="md:col-span-2 border-t border-slate-800 pt-4 mt-2">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest block mb-3">
                      Corporate Login Credentials
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="applicant@company.com"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Mobile Number *</label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+919876543210"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleNext}
                className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-blue-500/20"
              >
                <span>Continue to Dynamic KYC</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DYNAMIC KYC & DOCUMENTS */}
        {activeStep === 2 && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <span>Step 2 — Dynamic KYC Requirements ({accountType})</span>
              </h2>
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Tailored for {accountType}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">
                  PAN Number *
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold tracking-wider"
                />
              </div>

              {accountType === "PERSONAL" && (
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">
                    Aadhaar Number *
                  </label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(formatAadhaarInput(e.target.value))}
                    placeholder="XXXX-XXXX-1234"
                    maxLength={14}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold tracking-wider"
                  />
                </div>
              )}

              {accountType !== "PERSONAL" && (
                <>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={gstinNumber}
                      onChange={(e) => setGstinNumber(e.target.value.toUpperCase())}
                      placeholder="27AAACT1234A1Z5"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">CIN / Registration No.</label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="U27100MH1907PLC000260"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold tracking-wider"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Document Upload Sections */}
            <div className="space-y-4 pt-2">
              <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                Required Document Files for Verification
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredDocSpecs.map((spec) => {
                  const state = docUploads[spec.type];
                  return (
                    <div
                      key={spec.type}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-[11px]">{spec.label}</span>
                        {state?.uploaded && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30">
                            <Check className="h-3 w-3" /> PENDING VERIFICATION
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Document Number (Optional)"
                        value={state?.documentNumber || ""}
                        onChange={(e) =>
                          setDocUploads((prev) => ({
                            ...prev,
                            [spec.type]: {
                              ...prev[spec.type],
                              documentType: spec.type,
                              label: spec.label,
                              documentNumber: e.target.value,
                              file: prev[spec.type]?.file || null,
                              uploaded: !!prev[spec.type]?.file,
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-blue-500 text-[11px]"
                      />

                      <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-400 cursor-pointer transition-all text-[11px]">
                        <Upload className="h-4 w-4 text-blue-400" />
                        <span>{state?.file ? state.file.name : "Select PDF / Image File"}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUploadMock(spec.type, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setActiveStep(1)}
                className="px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold font-mono text-xs transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-blue-500/20"
              >
                <span>Continue to Bank Details</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: BANK DETAILS (OPTIONAL) */}
        {activeStep === 3 && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-400" />
                <span>Step 3 — Settlement Bank Details (Optional)</span>
              </h2>
              <button
                onClick={() => {
                  setSkipBank(true);
                  setActiveStep(4);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-amber-500/30"
              >
                <SkipForward className="h-3.5 w-3.5" />
                <span>Skip for Now</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="e.g. Sanjay Maloo"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="987654321098"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold tracking-wider"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  maxLength={11}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold tracking-wider"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Branch Name</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Main Branch, Jaipur"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Cancelled Cheque / Proof</label>
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-800 text-slate-400 cursor-pointer transition-all text-xs">
                  <Upload className="h-4 w-4 text-blue-400" />
                  <span>{chequeFile ? chequeFile.name : "Upload Cheque Image"}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files && setChequeFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setActiveStep(2)}
                className="px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold font-mono text-xs transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setSkipBank(false);
                  handleNext();
                }}
                className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-blue-500/20"
              >
                <span>Save Bank Details & Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: ACCOUNT PLAN & PAYMENT */}
        {activeStep === 4 && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-400" />
              <span>Step 4 — Select Enterprise Account Plan</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
              {/* FREE PLAN CARD */}
              <div
                onClick={() => setSelectedPlan("FREE")}
                className={`p-6 rounded-3xl border transition-all cursor-pointer space-y-4 relative ${
                  selectedPlan === "FREE"
                    ? "bg-blue-600/10 border-blue-500 shadow-xl shadow-blue-500/10"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                {selectedPlan === "FREE" && (
                  <span className="absolute top-4 right-4 p-1 rounded-full bg-blue-500 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white uppercase">FREE ACCOUNT</h3>
                  <div className="text-3xl font-extrabold text-blue-400">₹0</div>
                </div>
                <ul className="text-xs space-y-2 text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" /> Basic Buyer Access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" /> Industrial Auction Browsing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" /> Eligibility-based participation
                  </li>
                </ul>
              </div>

              {/* PAID PLAN CARD */}
              <div
                onClick={() => setSelectedPlan("PAID")}
                className={`p-6 rounded-3xl border transition-all cursor-pointer space-y-4 relative ${
                  selectedPlan === "PAID"
                    ? "bg-purple-600/10 border-purple-500 shadow-xl shadow-purple-500/10"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                {selectedPlan === "PAID" && (
                  <span className="absolute top-4 right-4 p-1 rounded-full bg-purple-500 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white uppercase">PAID PREMIUM</h3>
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-purple-400">₹2,500 <span className="text-xs font-normal text-slate-400">/ year</span></div>
                </div>
                <ul className="text-xs space-y-2 text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-400" /> Premium Buyer Access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-400" /> Priority EMD Refund & Settlement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-400" /> Dedicated Account Officer
                  </li>
                </ul>
              </div>
            </div>

            {/* PAID PLAN PAYMENT FORM */}
            {selectedPlan === "PAID" && (
              <div className="p-6 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-4 font-mono text-xs">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  Payment Details & Proof Upload (Required for Paid Account)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Amount (₹)</label>
                    <input
                      type="text"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      readOnly
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none font-bold"
                    >
                      <option value="UPI">UPI</option>
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="IMPS">IMPS</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-400 uppercase mb-1">
                      Payment Reference / UTR Number *
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. UTR129384729182"
                      required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none font-bold tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">
                      Payment Screenshot / Receipt *
                    </label>
                    <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-dashed border-purple-500/40 text-purple-300 cursor-pointer transition-all text-xs">
                      <Upload className="h-4 w-4" />
                      <span>{paymentProofFile ? paymentProofFile.name : "Upload Receipt Image"}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files && setPaymentProofFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setActiveStep(3)}
                className="px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold font-mono text-xs transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold font-mono text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/20"
              >
                <span>{isSubmitting ? "Submitting Application..." : "Submit Registration Application"}</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationScreen;
