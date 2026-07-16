import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useKycStore } from "../store/useKycStore";
import { useAppStore } from "../store/useAppStore";
import { useNotification } from "../providers/NotificationProvider";
import { bidderRegistrationSchema, BidderRegistrationSchemaType } from "../validation/kycSchema";
import { KycProgressStepper } from "../components/kyc/KycProgressStepper";
import { OnboardingService, BidderState, KycDocumentRequest } from "../api/onboardingService";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Clock, 
  AlertCircle, 
  Eye, 
  FileText, 
  RefreshCw,
  Info,
  CheckCircle2,
  Trash2,
  Building,
  User,
  Mail,
  Phone,
  Lock,
  Search,
  Check,
  Landmark,
  File,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const SellerRegistrationScreen: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { themeMode } = useAppStore();
  const { 
    activeStep, 
    setStep, 
    nextStep, 
    prevStep, 
    saveDraft, 
    loadDraft, 
    profile, 
    fetchProfile,
    registerProfile,
    isSubmitting,
    verifyBank,
    isVerifyingBank
  } = useKycStore();

  const isDark = themeMode === "dark";

  // State local to onboarding flow
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: any }>({});
  const [activePreviewDoc, setActivePreviewDoc] = useState<any | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Cognitive overload reduction and Async document simulation states
  const [businessSubStep, setBusinessSubStep] = useState(0);
  const [processingDocs, setProcessingDocs] = useState<{ [key: string]: boolean }>({});
  
  // Validation simulations
  const [isPanVerified, setIsPanVerified] = useState(false);
  const [isPanVerifying, setIsPanVerifying] = useState(false);
  const [isGstVerified, setIsGstVerified] = useState(false);
  const [isGstVerifying, setIsGstVerifying] = useState(false);

  // Initialize Form with React Hook Form
  const methods = useForm<BidderRegistrationSchemaType>({
    resolver: zodResolver(bidderRegistrationSchema),
    defaultValues: {
      bidderType: "INDIVIDUAL",
      userRole: "ROLE_SELLER",
      country: "India",
      panNumber: "",
      rawAadhaar: "", // Removed hardcoded Aadhaar value for clean slate onboarding
      organizationName: "",
      registrationNumber: "",
      gstin: "",
      registeredAddress: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
    }
  });

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = methods;
  const bidderType = watch("bidderType");
  const watchCountry = watch("country") || "India";
  const watchHolderName = watch("accountHolderName") || "BENEFICIARY HOLDER";
  const watchAccountNumber = watch("accountNumber") || "•••• •••• •••• ••••";
  const watchIfsc = watch("ifscCode") || "IFSC CODE";
  const watchBankName = watch("bankName") || "BANK PARTNER";
  const watchPan = watch("panNumber");
  const watchGst = watch("gstin");

  // Load drafts on mount
  useEffect(() => {
    fetchProfile();
    
    // Restore products draft
    const savedProducts = localStorage.getItem(`ea_kyc_draft_products_${user?.id || "default"}`);
    if (savedProducts) {
      try {
        setSelectedProducts(JSON.parse(savedProducts));
      } catch (e) {}
    }

    // Restore form draft
    const draft = loadDraft();
    if (draft && Object.keys(draft).length > 0) {
      Object.keys(draft).forEach((key) => {
        const val = (draft as any)[key];
        if (val) {
          setValue(key as any, val);
        }
      });
      // Set validation mock status if restored values are valid
      if (draft.panNumber && draft.panNumber.length === 10) setIsPanVerified(true);
      if (draft.gstin && draft.gstin.length === 15) setIsGstVerified(true);
    }

    // Restore uploaded files draft
    const savedFiles = localStorage.getItem(`ea_kyc_draft_files_${user?.id || "default"}`);
    if (savedFiles) {
      try {
        setUploadedFiles(JSON.parse(savedFiles));
      } catch (e) {}
    }
  }, [user]);

  // Save manual draft trigger
  const handleSaveDraft = () => {
    const currentValues = getValues();
    saveDraft(currentValues);
    showNotification("Onboarding progress saved as draft.", "success");
  };

  const handleProductsChange = (product: string) => {
    let updated: string[];
    if (selectedProducts.includes(product)) {
      updated = selectedProducts.filter(p => p !== product);
    } else {
      updated = [...selectedProducts, product];
    }
    setSelectedProducts(updated);
    localStorage.setItem(`ea_kyc_draft_products_${user?.id || "default"}`, JSON.stringify(updated));
  };

  // Simulated PAN validator
  const handleVerifyPan = () => {
    if (!watchPan || watchPan.length < 10) {
      showNotification("Please enter a valid 10-character PAN number first.", "warning");
      return;
    }
    setIsPanVerifying(true);
    setTimeout(() => {
      setIsPanVerifying(false);
      setIsPanVerified(true);
      showNotification("PAN Details automatically verified via Income Tax Dep logs.", "success");
    }, 1000);
  };

  // Simulated GST validator
  const handleVerifyGst = () => {
    if (!watchGst || watchGst.length < 15) {
      showNotification("Please enter a valid 15-character GSTIN number first.", "warning");
      return;
    }
    setIsGstVerifying(true);
    setTimeout(() => {
      setIsGstVerifying(false);
      setIsGstVerified(true);
      // Try to auto-populate Org Name if not filled
      if (!getValues("organizationName")) {
        setValue("organizationName", "Tata Steel Logistics Ltd");
      }
      showNotification("GSTIN active & validated against MCA GST Logs.", "success");
    }, 1000);
  };

  // Mock File Upload Handler with client-side MIME and Max-size checks + Async flow
  const handleFileUpload = (docType: string, file: File) => {
    // 1. Client-side MIME type check
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      showNotification("Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.", "error");
      return;
    }

    // 2. Client-side File size limit check (Max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      showNotification("File is too large. Maximum allowed size is 10MB.", "error");
      return;
    }

    // 3. Mark document as actively scanning/processing (async completion simulation)
    setProcessingDocs(prev => ({ ...prev, [docType]: true }));
    showNotification(`Uploading and scanning ${docType.replace(/_/g, " ")}...`, "info");

    setTimeout(() => {
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      const mockHash = Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      const newFileObj = {
        name: file.name,
        size: file.size,
        type: file.type,
        path: `/uploads/documents/${docType.toLowerCase()}_${Date.now()}.${file.type.split("/")[1]}`,
        hash: mockHash,
        previewUrl,
      };

      const updated = { ...uploadedFiles, [docType]: newFileObj };
      setUploadedFiles(updated);
      localStorage.setItem(`ea_kyc_draft_files_${user?.id || "default"}`, JSON.stringify(updated));
      
      // Stop scanning spinner
      setProcessingDocs(prev => ({ ...prev, [docType]: false }));
      showNotification(`${docType.replace(/_/g, " ")} parsed & verification pending.`, "success");
    }, 1800); // 1.8 second simulated OCR and secure upload latency
  };

  const handleFileDelete = (docType: string) => {
    const updated = { ...uploadedFiles };
    delete updated[docType];
    setUploadedFiles(updated);
    localStorage.setItem(`ea_kyc_draft_files_${user?.id || "default"}`, JSON.stringify(updated));
    showNotification(`${docType.replace(/_/g, " ")} removed.`, "info");
  };

  // Final Registration & submission sequence
  const onSubmitCompleteRegistration = async (data: BidderRegistrationSchemaType) => {
    // Check if documents are uploaded
    const requiredDocs = bidderType === "CORPORATE" 
      ? ["PAN_CARD", "GST_CERTIFICATE", "CANCELLED_CHEQUE"]
      : ["PAN_CARD", "CANCELLED_CHEQUE"];

    const missingDocs = requiredDocs.filter(d => !uploadedFiles[d]);
    if (missingDocs.length > 0) {
      showNotification(`Missing required uploads in Step 3: ${missingDocs.map(d => d.replace(/_/g, " ")).join(", ")}`, "warning");
      setStep(2); // take them back to upload step!
      return;
    }

    try {
      data.userRole = "ROLE_SELLER";
      // 1. Submit Profile metadata
      const res = await registerProfile(data);
      
      // 2. Submit documents
      const docRequests: KycDocumentRequest[] = Object.keys(uploadedFiles).map(key => ({
        documentType: key,
        storagePath: uploadedFiles[key].path,
        documentHash: uploadedFiles[key].hash,
        mimeType: uploadedFiles[key].type,
        fileSize: uploadedFiles[key].size,
      }));
      await OnboardingService.submitDocuments(res.id, docRequests);

      // 3. Automated Bank penny verification
      await OnboardingService.verifyBankAccount(res.id);

      showNotification("Onboarding submitted successfully! Penny-drop verified, profile is under audit.", "success");
      fetchProfile();
    } catch (err: any) {
      showNotification(err.message || "Registration submission failed.", "error");
    }
  };

  // Popular Products list matching screenshot
  const popularProductsList = [
    "FERROUS SCRAP",
    "HR COIL",
    "HR SHEET",
    "HR PLATE",
    "MISCELLANEOUS SCRAP",
    "NON-FERROUS SCRAP",
    "ALUMINUM INGOTS",
    "BILLET COILS",
    "COPPER CATHODES"
  ];

  const filteredPopularProducts = popularProductsList.filter(p => 
    p.toLowerCase().includes(productSearch.toLowerCase())
  );

  const getStatesForCountry = (country: string) => {
    switch (country) {
      case "Singapore":
        return ["Central", "East", "North", "North-East", "West"];
      case "United Arab Emirates":
      case "UAE":
        return ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];
      case "United Kingdom":
      case "UK":
        return ["England", "Scotland", "Wales", "Northern Ireland"];
      default:
        return ["Jharkhand", "West Bengal", "Maharashtra", "Delhi NCR", "Karnataka", "Odisha"];
    }
  };

  // Render Form Steps dynamically
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        if (businessSubStep === 0) {
          return (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className={`space-y-6 border p-6 rounded-2xl ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
              }`}>
                <div className="border-b pb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4.5 w-4.5 text-blue-600" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-blue-950"}`}>
                      Part 1 of 2: Corporate & Identity Settings ({watchCountry})
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                    Step 1A of 5
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Country Dropdown */}
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Country*
                    </label>
                    <select 
                      {...register("country")}
                      onChange={(e) => {
                        setValue("country", e.target.value);
                        handleSaveDraft();
                      }}
                      className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none transition-all ${
                        isDark 
                          ? "bg-slate-950 border-slate-800 text-slate-200" 
                          : "bg-slate-50 border-slate-200 text-blue-950"
                      }`}
                    >
                      <option value="India">India</option>
                      <option value="Singapore">Singapore</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="United Kingdom">United Kingdom</option>
                    </select>
                  </div>

                  {/* Organisation / Entity Type */}
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Organisation Type*
                    </label>
                    <select
                      value={bidderType}
                      onChange={(e) => {
                        setValue("bidderType", e.target.value as any);
                        handleSaveDraft();
                      }}
                      className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none transition-all ${
                        isDark 
                          ? "bg-slate-950 border-slate-800 text-slate-200" 
                          : "bg-slate-50 border-slate-200 text-blue-950"
                      }`}
                    >
                      <option value="INDIVIDUAL">Proprietorship / Individual</option>
                      <option value="CORPORATE">Private Limited Company / LLP</option>
                    </select>
                  </div>

                  {/* --- INDIA-SPECIFIC DYNAMIC IDENTITY FIELDS --- */}
                  {watchCountry === "India" && (
                    <>
                      {bidderType === "CORPORATE" && (
                        <>
                          {/* India GSTIN */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              GSTIN Registration*
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                {...register("gstin")}
                                placeholder="Enter 15-character GSTIN (e.g., 27AAAAA1111A1Z1)"
                                className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none uppercase tracking-widest ${
                                  isDark 
                                    ? "bg-slate-950 border-slate-800 text-slate-200" 
                                    : "bg-slate-50 border-slate-200 text-blue-950"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={handleVerifyGst}
                                disabled={isGstVerifying}
                                className={`px-4 rounded-lg font-bold text-[10px] uppercase cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                                  isGstVerified 
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                    : "bg-blue-900 hover:bg-blue-800 text-white"
                                }`}
                              >
                                {isGstVerifying ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
                                <span>{isGstVerified ? "✓ VALIDATED" : "VALIDATE"}</span>
                              </button>
                            </div>
                            {errors.gstin && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.gstin.message}</p>
                            )}
                          </div>

                          {/* Registered Corporate Name */}
                          <div className="space-y-1.5">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Registered Corporate Name*
                            </label>
                            <input
                              type="text"
                              {...register("organizationName")}
                              placeholder="Organization name (e.g. Tata Steel Ltd)"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.organizationName && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.organizationName.message}</p>
                            )}
                          </div>

                          {/* MCA CIN */}
                          <div className="space-y-1.5">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Corporate CIN / Registration Number*
                            </label>
                            <input
                              type="text"
                              {...register("registrationNumber")}
                              placeholder="Corporate identity registration (CIN)"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none uppercase ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.registrationNumber && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.registrationNumber.message}</p>
                            )}
                          </div>
                        </>
                      )}

                      {/* PAN Card Input with Validation */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          {bidderType === "CORPORATE" ? "Company PAN Card*" : "Proprietor's PAN Card*"}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            {...register("panNumber")}
                            placeholder="Enter 10-character PAN (e.g., ABCDE1234F)"
                            className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none uppercase tracking-widest ${
                              isDark 
                                ? "bg-slate-950 border-slate-800 text-slate-200" 
                                : "bg-slate-50 border-slate-200 text-blue-950"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyPan}
                            disabled={isPanVerifying}
                            className={`px-4 rounded-lg font-bold text-[10px] uppercase cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                              isPanVerified 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                : "bg-blue-900 hover:bg-blue-800 text-white"
                            }`}
                          >
                            {isPanVerifying ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
                            <span>{isPanVerified ? "✓ VALIDATED" : "VALIDATE"}</span>
                          </button>
                        </div>
                        {errors.panNumber && (
                          <p className="text-[9px] text-red-500 font-mono">● {errors.panNumber.message}</p>
                        )}
                      </div>

                      {/* India Individual Aadhaar Input */}
                      {bidderType === "INDIVIDUAL" && (
                        <div className="space-y-1.5 md:col-span-2">
                          <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            Aadhaar Card Number*
                          </label>
                          <input
                            type="text"
                            {...register("rawAadhaar")}
                            placeholder="Enter 12-digit Aadhaar (e.g., 1234-5678-9012)"
                            className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none font-mono ${
                              isDark 
                                ? "bg-slate-950 border-slate-800 text-slate-200" 
                                : "bg-slate-50 border-slate-200 text-blue-950"
                            }`}
                          />
                          {errors.rawAadhaar && (
                            <p className="text-[9px] text-red-500 font-mono">● {errors.rawAadhaar.message}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* --- SINGAPORE-SPECIFIC DYNAMIC IDENTITY FIELDS --- */}
                  {watchCountry === "Singapore" && (
                    <>
                      {bidderType === "CORPORATE" ? (
                        <>
                          {/* Singapore UEN */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Unique Entity Number (UEN)*
                            </label>
                            <input
                              type="text"
                              {...register("panNumber")}
                              placeholder="Enter Singapore UEN (e.g. 201234567N)"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none uppercase font-mono ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.panNumber && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.panNumber.message}</p>
                            )}
                          </div>

                          {/* Registered Corporate Name */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Registered Corporate Name*
                            </label>
                            <input
                              type="text"
                              {...register("organizationName")}
                              placeholder="Singapore ACRA Registered Entity Name"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.organizationName && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.organizationName.message}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        /* Singapore Individual NRIC/FIN */
                        <div className="space-y-1.5 md:col-span-2">
                          <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            NRIC / FIN Number*
                          </label>
                          <input
                            type="text"
                            {...register("panNumber")}
                            placeholder="Enter Singapore NRIC/FIN (e.g., S1234567A)"
                            className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none uppercase font-mono ${
                              isDark 
                                ? "bg-slate-950 border-slate-800 text-slate-200" 
                                : "bg-slate-50 border-slate-200 text-blue-950"
                            }`}
                          />
                          {errors.panNumber && (
                            <p className="text-[9px] text-red-500 font-mono">● {errors.panNumber.message}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* --- UAE-SPECIFIC DYNAMIC IDENTITY FIELDS --- */}
                  {watchCountry === "United Arab Emirates" && (
                    <>
                      {bidderType === "CORPORATE" ? (
                        <>
                          {/* UAE TRN */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Tax Registration Number (TRN)*
                            </label>
                            <input
                              type="text"
                              {...register("panNumber")}
                              placeholder="Enter UAE 15-digit TRN (e.g. 100123456789012)"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none font-mono ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.panNumber && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.panNumber.message}</p>
                            )}
                          </div>

                          {/* UAE Trade License Number */}
                          <div className="space-y-1.5">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Trade License Number*
                            </label>
                            <input
                              type="text"
                              {...register("registrationNumber")}
                              placeholder="DED Trade License Registration"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none uppercase ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.registrationNumber && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.registrationNumber.message}</p>
                            )}
                          </div>

                          {/* Registered Corporate Name */}
                          <div className="space-y-1.5">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Registered Corporate Name*
                            </label>
                            <input
                              type="text"
                              {...register("organizationName")}
                              placeholder="Registered entity license name"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.organizationName && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.organizationName.message}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        /* UAE Individual Emirates ID */
                        <div className="space-y-1.5 md:col-span-2">
                          <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            Emirates ID Number*
                          </label>
                          <input
                            type="text"
                            {...register("rawAadhaar")}
                            placeholder="Enter Emirates ID (e.g. 784-1980-1234567-1)"
                            className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none font-mono ${
                              isDark 
                                ? "bg-slate-950 border-slate-800 text-slate-200" 
                                : "bg-slate-50 border-slate-200 text-blue-950"
                            }`}
                          />
                          {errors.rawAadhaar && (
                            <p className="text-[9px] text-red-500 font-mono">● {errors.rawAadhaar.message}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* --- UK-SPECIFIC DYNAMIC IDENTITY FIELDS --- */}
                  {watchCountry === "United Kingdom" && (
                    <>
                      {bidderType === "CORPORATE" ? (
                        <>
                          {/* UK CRN */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Company House CRN*
                            </label>
                            <input
                              type="text"
                              {...register("panNumber")}
                              placeholder="Enter UK Company Registration Number (8 characters)"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none uppercase font-mono ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.panNumber && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.panNumber.message}</p>
                            )}
                          </div>

                          {/* UK VAT Number (Optional) */}
                          <div className="space-y-1.5">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              VAT Number (Optional)
                            </label>
                            <input
                              type="text"
                              {...register("gstin")}
                              placeholder="9-digit VAT registration number"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none uppercase ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.gstin && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.gstin.message}</p>
                            )}
                          </div>

                          {/* Registered Corporate Name */}
                          <div className="space-y-1.5">
                            <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Registered Corporate Name*
                            </label>
                            <input
                              type="text"
                              {...register("organizationName")}
                              placeholder="UK Registered Legal Corporate Name"
                              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none ${
                                isDark 
                                  ? "bg-slate-950 border-slate-800 text-slate-200" 
                                  : "bg-slate-50 border-slate-200 text-blue-950"
                              }`}
                            />
                            {errors.organizationName && (
                              <p className="text-[9px] text-red-500 font-mono">● {errors.organizationName.message}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        /* UK Individual National Insurance Number */
                        <div className="space-y-1.5 md:col-span-2">
                          <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            National Insurance Number (NINO)*
                          </label>
                          <input
                            type="text"
                            {...register("rawAadhaar")}
                            placeholder="Enter National Insurance Number (e.g. QQ123456C)"
                            className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none uppercase font-mono ${
                              isDark 
                                ? "bg-slate-950 border-slate-800 text-slate-200" 
                                : "bg-slate-50 border-slate-200 text-blue-950"
                            }`}
                          />
                          {errors.rawAadhaar && (
                            <p className="text-[9px] text-red-500 font-mono">● {errors.rawAadhaar.message}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}


                  {/* --- GEOGRAPHIC LOCATION PARAMETERS --- */}
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      State / Province*
                    </label>
                    <select
                      className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none transition-all ${
                        isDark 
                          ? "bg-slate-950 border-slate-800 text-slate-200" 
                          : "bg-slate-50 border-slate-200 text-blue-950"
                      }`}
                    >
                      {getStatesForCountry(watchCountry).map(state => (
                        <option key={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      City / Municipal Area*
                    </label>
                    <input
                      type="text"
                      placeholder="Enter City"
                      className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none ${
                        isDark 
                          ? "bg-slate-950 border-slate-800 text-slate-200" 
                          : "bg-slate-50 border-slate-200 text-blue-950"
                      }`}
                    />
                  </div>

                  {/* Registered Address */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Street Address*
                    </label>
                    <input
                      type="text"
                      {...register("registeredAddress")}
                      placeholder="Registered business address"
                      className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none ${
                        isDark 
                          ? "bg-slate-950 border-slate-800 text-slate-200" 
                          : "bg-slate-50 border-slate-200 text-blue-950"
                      }`}
                    />
                    {errors.registeredAddress && (
                      <p className="text-[9px] text-red-500 font-mono">● {errors.registeredAddress.message}</p>
                    )}
                  </div>

                  {/* ZIP / PIN */}
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {watchCountry === "India" ? "PIN Code*" : "ZIP / Postal Code*"}
                    </label>
                    <input
                      type="text"
                      placeholder="Postal Code / PIN"
                      maxLength={10}
                      className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none font-mono ${
                        isDark 
                          ? "bg-slate-950 border-slate-800 text-slate-200" 
                          : "bg-slate-50 border-slate-200 text-blue-950"
                      }`}
                    />
                  </div>
                </div>

                {/* Substep Navigation Trigger */}
                <div className="flex justify-end pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveDraft();
                      setBusinessSubStep(1);
                    }}
                    className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 py-2 rounded-lg cursor-pointer transition-all shadow text-xs uppercase"
                  >
                    <span>Add Settlement Bank Details</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        } else {
          // --- SUBSTEP 1: Settlement Escrow Link ---
          const getBankRoutingLabel = () => {
            switch (watchCountry) {
              case "Singapore":
                return "SWIFT/BIC Code*";
              case "United Arab Emirates":
              case "UAE":
                return "SWIFT/BIC Code*";
              case "United Kingdom":
              case "UK":
                return "Sort Code*";
              default:
                return "IFSC Swift Code*";
            }
          };

          const getBankRoutingPlaceholder = () => {
            switch (watchCountry) {
              case "Singapore":
                return "e.g. DBSSSGSGXXX";
              case "United Arab Emirates":
              case "UAE":
                return "e.g. BARCAEADXXX";
              case "United Kingdom":
              case "UK":
                return "6-digit Sort Code";
              default:
                return "IFSC (e.g. HDFC0001234)";
            }
          };

          const getBankAccountPlaceholder = () => {
            if (watchCountry === "United Arab Emirates" || watchCountry === "UAE") {
              return "Enter UAE IBAN (starts with AE + 21 digits)";
            }
            if (watchCountry === "United Kingdom" || watchCountry === "UK") {
              return "Enter 8-digit UK account number";
            }
            return "Account number for settlement clearance";
          };

          return (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Right Column: Escrow Bank clearing account */}
                <div className={`space-y-5 border p-6 rounded-2xl lg:col-span-2 ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                }`}>
                  <div className="border-b pb-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4.5 w-4.5 text-blue-600" />
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-blue-950"}`}>
                        Part 2 of 2: Settlement Escrow Link
                      </h3>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                      Step 1B of 5
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Beneficiary */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Account Beneficiary Name*
                      </label>
                      <input
                        type="text"
                        {...register("accountHolderName")}
                        placeholder="Full name as printed on bank passbook"
                        className={`w-full border rounded-lg p-2 text-xs focus:outline-none ${
                          isDark 
                            ? "bg-slate-950 border-slate-850 text-slate-200" 
                            : "bg-slate-50 border-slate-150 text-blue-950"
                        }`}
                      />
                      {errors.accountHolderName && (
                        <p className="text-[9px] text-red-500 font-mono">● {errors.accountHolderName.message}</p>
                      )}
                    </div>

                    {/* Account Number */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Bank Account Number*
                      </label>
                      <input
                        type="text"
                        {...register("accountNumber")}
                        placeholder={getBankAccountPlaceholder()}
                        className={`w-full border rounded-lg p-2 text-xs focus:outline-none font-mono ${
                          isDark 
                            ? "bg-slate-950 border-slate-850 text-slate-200" 
                            : "bg-slate-50 border-slate-150 text-blue-950"
                        }`}
                      />
                      {errors.accountNumber && (
                        <p className="text-[9px] text-red-500 font-mono">● {errors.accountNumber.message}</p>
                      )}
                    </div>

                    {/* Bank Name */}
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Bank Institution Name*
                      </label>
                      <input
                        type="text"
                        {...register("bankName")}
                        placeholder="E.g. HSBC, Barclays, Standard Chartered"
                        className={`w-full border rounded-lg p-2 text-xs focus:outline-none ${
                          isDark 
                            ? "bg-slate-950 border-slate-850 text-slate-200" 
                            : "bg-slate-50 border-slate-150 text-blue-950"
                        }`}
                      />
                      {errors.bankName && (
                        <p className="text-[9px] text-red-500 font-mono">● {errors.bankName.message}</p>
                      )}
                    </div>

                    {/* IFSC Routing */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          {getBankRoutingLabel()}
                        </label>
                        <input
                          type="text"
                          {...register("ifscCode")}
                          placeholder={getBankRoutingPlaceholder()}
                          className={`w-full border rounded-lg p-2 text-xs focus:outline-none uppercase font-mono ${
                            isDark 
                              ? "bg-slate-950 border-slate-850 text-slate-200" 
                              : "bg-slate-50 border-slate-150 text-blue-950"
                          }`}
                        />
                        {errors.ifscCode && (
                          <p className="text-[9px] text-red-500 font-mono">● {errors.ifscCode.message}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          Branch Location*
                        </label>
                        <input
                          type="text"
                          {...register("branchName")}
                          placeholder="Branch city"
                          className={`w-full border rounded-lg p-2 text-xs focus:outline-none ${
                            isDark 
                              ? "bg-slate-950 border-slate-850 text-slate-200" 
                              : "bg-slate-50 border-slate-150 text-blue-950"
                          }`}
                        />
                        {errors.branchName && (
                          <p className="text-[9px] text-red-500 font-mono">● {errors.branchName.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Navigation inside Bank info */}
                    <div className="flex gap-2 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => setBusinessSubStep(0)}
                        className={`flex-1 border text-center font-bold px-4 py-2 rounded-lg cursor-pointer transition-all text-xs uppercase ${
                          isDark 
                            ? "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700" 
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        Back to Corporate Identity
                      </button>
                    </div>
                  </div>
                </div>

                {/* Left Column: Real-time card mockup */}
                <div className={`space-y-4 border p-5 rounded-2xl h-fit ${
                  isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-150 shadow-sm"
                }`}>
                  <h4 className="text-[10px] font-extrabold text-blue-950 dark:text-slate-300 uppercase tracking-wider">
                    Secure Clearing Link
                  </h4>
                  <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4 rounded-xl border border-blue-900/40 flex flex-col justify-between aspect-video relative overflow-hidden shadow-md">
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <p className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest">{watchBankName}</p>
                        <p className="text-[7px] text-slate-450 font-mono mt-0.5">ESCROW INTEGRATION</p>
                      </div>
                    </div>
                    <div className="space-y-2 z-10">
                      <p className="text-xs font-mono font-bold tracking-widest text-slate-100 truncate bg-black/20 p-1 rounded border border-white/5">{watchAccountNumber}</p>
                      <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-300">
                        <div className="truncate">
                          <p className="text-[6px] text-slate-500 font-mono">BENEFICIARY</p>
                          <p className="font-bold truncate uppercase">{watchHolderName}</p>
                        </div>
                        <div className="text-right truncate">
                          <p className="text-[6px] text-slate-500 font-mono">{watchCountry === "United Kingdom" || watchCountry === "UK" ? "SORT CODE" : "IFSC ROUTING"}</p>
                          <p className="font-bold text-blue-400 uppercase tracking-wider">{watchIfsc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    This account is registered with our automated Clearing Clearing link. We utilize micro-deposit routing and penny-drop simulations to secure settlement linkages.
                  </p>
                </div>

              </div>
            </div>
          );
        }

      case 1:
        return (
          <div className={`border p-6 rounded-2xl max-w-2xl mx-auto space-y-6 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
          }`}>
            <div className="border-b pb-3.5 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-blue-600" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-blue-950"}`}>
                Authorized Contact Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Representative Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Authorized Representative Name*
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Sanjay"
                    className={`w-full border rounded-lg p-2.5 pl-10 text-xs focus:outline-none ${
                      isDark 
                        ? "bg-slate-950 border-slate-800 text-slate-200" 
                        : "bg-slate-50 border-slate-200 text-blue-950"
                    }`}
                  />
                </div>
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Mobile Number*
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="6356656666"
                    className={`w-full border rounded-lg p-2.5 pl-10 text-xs focus:outline-none font-mono ${
                      isDark 
                        ? "bg-slate-950 border-slate-800 text-slate-200" 
                        : "bg-slate-50 border-slate-200 text-blue-950"
                    }`}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Email Address*
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="sanjay@tatasteel.com"
                    className={`w-full border rounded-lg p-2.5 pl-10 text-xs focus:outline-none ${
                      isDark 
                        ? "bg-slate-950 border-slate-800 text-slate-200" 
                        : "bg-slate-50 border-slate-200 text-blue-950"
                    }`}
                  />
                </div>
              </div>

              {/* Checkboxes from screenshot */}
              <div className="md:col-span-2 pt-3 space-y-3 border-t border-slate-100 dark:border-slate-850">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                  />
                  <span className={`text-[10px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    I would like to receive notifications and e-auction updates via WhatsApp and SMS channels.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                  />
                  <span className={`text-[10px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    By creating a business account, you agree to the Eagle Auctioner / mjunction <span className="text-blue-600 hover:underline">Terms and Conditions</span> and <span className="text-blue-600 hover:underline">Privacy Clearance Policy</span>. You are creating a business account on behalf of the organisation named above.
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={`border p-6 rounded-2xl max-w-4xl mx-auto space-y-6 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
          }`}>
            <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase text-[#d46b08] tracking-wider font-sans">
                  Document Verification
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Please share high resolution copies of the following documents.</p>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-100 dark:border-slate-850">
                Formats: PDF, JPG, JPEG (Max 10MB)
              </span>
            </div>

            {/* Document Verification Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider text-slate-450 ${
                    isDark ? "border-slate-850" : "border-slate-100"
                  }`}>
                    <th className="py-2.5">Supporting Document</th>
                    <th className="py-2.5 text-center">Audit status</th>
                    <th className="py-2.5 text-right">Upload action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {[
                    { id: "PAN_CARD", label: "Upload PAN Document (Self-Attested)", desc: "Government issued tax account card" },
                    ...(bidderType === "CORPORATE" 
                      ? [
                          { id: "GST_CERTIFICATE", label: "Upload GST Document (Self-Attested)", desc: "REG-06 registration certificate copy" },
                          { id: "COMPANY_INCORPORATION", label: "Upload Certificate of Incorporation (Authorized Signatory)", desc: "MCA certificate details" }
                        ]
                      : [
                          { id: "AADHAAR_CARD", label: "Upload Aadhaar Card (Self-Attested)", desc: "UIDAI front/back composite card" }
                        ]
                    ),
                    { id: "CANCELLED_CHEQUE", label: "Upload Signature issued by bank / Cancelled Cheque", desc: "For verifying Escrow clearing linkages" }
                  ].map((doc) => {
                    const uploaded = uploadedFiles[doc.id];
                    
                    return (
                      <tr key={doc.id} className="group hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-all">
                        <td className="py-4 pr-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${
                              uploaded 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-slate-50 text-slate-400 border-slate-200"
                            }`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className={`font-sans font-medium text-xs ${isDark ? "text-slate-200" : "text-blue-950"}`}>
                                {doc.label}
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{doc.desc}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          {uploaded ? (
                            <span className="px-2.5 py-1 rounded-full text-[8px] font-extrabold uppercase border bg-amber-50 text-amber-600 border-amber-200 inline-flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 animate-pulse" /> Verification Pending
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[8px] font-extrabold uppercase border bg-blue-50 text-blue-600 border-blue-150 inline-flex items-center gap-1">
                              ● Required
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          {uploaded ? (
                            <div className="inline-flex items-center gap-2">
                              {uploaded.previewUrl && (
                                <button
                                  type="button"
                                  onClick={() => setActivePreviewDoc({ name: doc.label, url: uploaded.previewUrl })}
                                  className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-blue-950 cursor-pointer"
                                  title="Preview Document"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleFileDelete(doc.id)}
                                className="p-1.5 rounded border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative inline-block">
                              <input
                                type="file"
                                id={`file-upload-${doc.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileUpload(doc.id, e.target.files[0]);
                                  }
                                }}
                                accept="application/pdf,image/*"
                              />
                              <label
                                htmlFor={`file-upload-${doc.id}`}
                                className="inline-block border border-blue-400 hover:bg-sky-50 text-blue-600 font-sans font-bold text-[10px] tracking-wide px-4 py-1.5 rounded cursor-pointer transition-all uppercase"
                              >
                                UPLOAD
                              </label>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-4xl mx-auto">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-0 border rounded-2xl overflow-hidden ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-lg"
            }`}>
              
              {/* Left Side: Gorgeous Welcome Illustration */}
              <div className="bg-gradient-to-br from-[#0c2e5d] to-[#12589f] p-8 flex flex-col justify-between relative text-white">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-xl" />
                  <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-blue-300 blur-2xl" />
                </div>
                
                <div className="space-y-2 z-10">
                  <span className="text-[10px] font-mono tracking-widest text-sky-300 uppercase block">Eagle Auctioner</span>
                  <h2 className="text-xl font-bold font-sans tracking-tight">Enterprise Onboarding</h2>
                  <p className="text-[11px] text-sky-100/80 leading-relaxed max-w-xs pt-1">
                    Your credentials authorize multi-tier bidder allocations across prime national scrap clearing routes.
                  </p>
                </div>

                {/* SVG Mockup representing mJunction bid desk */}
                <div className="my-8 flex justify-center z-10">
                  <svg className="w-56 h-40 text-sky-200/90" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="20" width="160" height="100" rx="6" fill="#082046" stroke="#1d4f91" strokeWidth="3" />
                    <rect x="25" y="25" width="150" height="12" rx="2" fill="#143c75" />
                    <circle cx="32" cy="31" r="2.5" fill="#12c2e9" />
                    <circle cx="40" cy="31" r="2.5" fill="#c471ed" />
                    <circle cx="48" cy="31" r="2.5" fill="#f64f59" />
                    {/* Bidding charts */}
                    <line x1="35" y1="95" x2="65" y2="65" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="65" y1="65" x2="95" y2="85" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="95" y1="85" x2="135" y2="45" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="135" cy="45" r="4.5" fill="#10b981" />
                    
                    {/* Floating HUD status */}
                    <rect x="110" y="80" width="60" height="30" rx="4" fill="#12589f" stroke="#3b82f6" strokeWidth="1" />
                    <text x="115" y="93" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">ACTIVE BID</text>
                    <text x="115" y="103" fill="#10b981" fontSize="8" fontWeight="bold" fontFamily="mono">₹4,85,000</text>
                    
                    {/* Stand */}
                    <rect x="85" y="120" width="30" height="10" fill="#1d4f91" />
                    <ellipse cx="100" cy="130" rx="30" ry="4" fill="#0c2e5d" />
                  </svg>
                </div>

                <div className="text-[10px] text-sky-200/60 z-10">
                  Secure single-sign-on credentials verified via active TLS tunnels.
                </div>
              </div>

              {/* Right Side: Form inputs */}
              <div className="p-8 flex flex-col justify-center space-y-6">
                <div>
                  <span className="text-[#d46b08] font-bold text-xs uppercase tracking-wide block font-sans">
                    Welcome to e-Auction Platform
                  </span>
                  <h3 className={`text-base font-extrabold tracking-tight mt-1 ${isDark ? "text-white" : "text-blue-950"}`}>
                    Set your Password
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Configure secure access credentials for active trading desks.</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Password 1 */}
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      New Password*
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`w-full border rounded-lg p-2.5 pl-10 pr-10 text-xs focus:outline-none ${
                          isDark 
                            ? "bg-slate-950 border-slate-800 text-slate-200" 
                            : "bg-slate-50 border-slate-200 text-blue-950"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-950 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Password 2 */}
                  <div className="space-y-1.5">
                    <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Confirm Password*
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`w-full border rounded-lg p-2.5 pl-10 pr-10 text-xs focus:outline-none ${
                          isDark 
                            ? "bg-slate-950 border-slate-800 text-slate-200" 
                            : "bg-slate-50 border-slate-200 text-blue-950"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-blue-950 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Password strength guidelines */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850 text-[10px] leading-relaxed text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-400 uppercase text-[9px] tracking-wider">Password Strength Rules:</p>
                    <p className="flex items-center gap-1.5"><span className="text-emerald-500">✔</span> Minimum 8 characters long</p>
                    <p className="flex items-center gap-1.5"><span className="text-emerald-500">✔</span> Includes at least 1 uppercase letter and 1 numeric digit</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );

      case 4:
        return (
          <div className={`border p-6 rounded-2xl max-w-3xl mx-auto space-y-6 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
          }`}>
            <div className="border-b pb-4">
              <h3 className="text-sm font-bold uppercase text-[#d46b08] tracking-wider font-sans">
                Select your Product of Interest
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Please select the industrial commodities and clearing categories you wish to participate bidding in.</p>
            </div>

            {/* Product Search bar */}
            <div className="space-y-1.5 text-xs">
              <label className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Product Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Select Product categories"
                  className={`w-full border rounded-lg p-2.5 pl-10 text-xs focus:outline-none ${
                    isDark 
                      ? "bg-slate-950 border-slate-850 text-slate-200" 
                      : "bg-slate-50 border-slate-150 text-blue-950"
                  }`}
                />
              </div>
            </div>

            {/* Popular Products Checkbox Grid */}
            <div className="space-y-2.5">
              <span className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Popular Products
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredPopularProducts.map((prod) => {
                  const isChecked = selectedProducts.includes(prod);
                  return (
                    <div 
                      key={prod}
                      onClick={() => handleProductsChange(prod)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked 
                          ? "bg-blue-50/40 border-blue-400 text-blue-900" 
                          : isDark
                          ? "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-sans font-bold text-[10px] tracking-wide">{prod}</span>
                      <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                        isChecked 
                          ? "bg-blue-900 border-blue-900 text-white" 
                          : "border-slate-350 bg-white"
                      }`}>
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Products Chips */}
            {selectedProducts.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-150 dark:border-slate-850">
                <span className={`block text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Selected Products
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((prod) => (
                    <span 
                      key={prod}
                      className="inline-flex items-center gap-1 bg-[#fffbe6] text-[#d46b08] border border-[#ffe58f] rounded-full px-3 py-1 text-[10px] font-bold font-sans tracking-wide"
                    >
                      <span>{prod}</span>
                      <button 
                        type="button" 
                        onClick={() => handleProductsChange(prod)}
                        className="text-[#d46b08] hover:text-[#ad2102] font-extrabold cursor-pointer text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 font-mono text-xs ${isDark ? "text-slate-300" : "text-slate-800"}`}>
      
      {/* HEADER HERO BAR */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 rounded-2xl relative overflow-hidden border ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-900 via-orange-500 to-emerald-500" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            <h1 className={`text-sm font-bold uppercase tracking-widest ${isDark ? "text-white" : "text-blue-950"}`}>
              Seller Onboarding Portal
            </h1>
          </div>
          <p className="text-[10px] text-slate-500">
            Submit statutory parameters to secure platform selling and escrow billing access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!profile && (
            <button
              onClick={handleSaveDraft}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                isDark 
                  ? "border-slate-800 bg-slate-950 text-slate-400 hover:text-white" 
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:text-blue-950"
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </button>
          )}

          {profile && (
            <span className="px-3 py-1 rounded-full text-[9px] font-extrabold uppercase border bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center gap-1 shadow-sm">
              ● KYC Status: {profile.state}
            </span>
          )}
        </div>
      </div>

      {/* 5-STEP REFERENCE PROGRESS TRACKER */}
      <KycProgressStepper activeStep={profile ? 5 : activeStep} entityType={bidderType} />

      {/* REGISTRATION FORM MODE */}
      {!profile ? (
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmitCompleteRegistration)} className="space-y-6">
            
            {/* Dynamic Step Overlap Content Area */}
            <div className="-mt-8 relative z-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* STICKY ACTION BUTTONS BAR */}
            <div className={`flex justify-between items-center p-4 rounded-xl border sticky bottom-4 z-30 shadow-lg ${
              isDark ? "bg-slate-900/90 border-slate-800 backdrop-blur-md" : "bg-white/95 border-slate-200 backdrop-blur-md"
            }`}>
              <button
                type="button"
                disabled={activeStep === 0}
                onClick={prevStep}
                className={`flex items-center gap-1 border font-bold px-4 py-2 rounded-lg cursor-pointer transition-all disabled:opacity-40 ${
                  isDark 
                    ? "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700" 
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                {activeStep < 4 ? (
                  <button
                    type="button"
                    onClick={async () => {
                      handleSaveDraft();
                      nextStep();
                    }}
                    className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-lg cursor-pointer transition-all shadow text-[11px]"
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-[#12589f] hover:bg-blue-800 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-lg cursor-pointer transition-all shadow-xl text-[11px]"
                  >
                    <span>{isSubmitting ? "Submitting..." : "CONFIRM & SUBMIT"}</span>
                    <ChevronRight className="h-4 w-4 stroke-[3]" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      ) : (
        /* REGISTERED MODE - KYC ONBOARDING DASHBOARD REVIEW (Matches reference Image 6 & 8) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Continuation Alert bar (Image 6) */}
            <div className="border border-amber-200 bg-amber-50/50 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-[#d46b08] shrink-0">
                  <Clock className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-blue-950 font-sans">
                    Finish the process to start bidding
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Your KYC registration dossier has been submitted. Compliance audits are in-progress and standard SLA clearance is under 4 hours.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  showNotification("Compliance review already submitted. Waiting for audit.", "info");
                }}
                className="bg-[#12589f] hover:bg-blue-800 text-white font-sans font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-lg shrink-0 transition-all shadow-md"
              >
                CONTINUE
              </button>
            </div>

            {/* RECORD SUMMARY DETAILS */}
            <div className={`border p-6 rounded-2xl space-y-4 ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
            }`}>
              <div className={`border-b pb-3.5 flex justify-between items-center ${
                isDark ? "border-slate-850" : "border-slate-150"
              }`}>
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-blue-950"}`}>
                    Seller Registry Records
                  </h3>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">Dossier ID: {profile.id}</p>
                </div>
                <span className="text-[9px] font-bold text-blue-900 bg-blue-900/10 border border-blue-900/20 px-2.5 py-1 rounded-full uppercase">
                  {profile.bidderType} PROFILE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px]">
                <div className={`p-4 rounded-xl border space-y-1 bg-slate-50/50 dark:bg-slate-950 border-slate-150/60 dark:border-slate-850`}>
                  <span className="text-slate-500 font-bold block uppercase text-[8px] tracking-wider">Primary Tax PAN</span>
                  <span className={`font-bold tracking-wider font-mono text-xs ${isDark ? "text-slate-200" : "text-blue-950"}`}>{profile.maskedPan}</span>
                  <span className="text-slate-500 font-bold block uppercase text-[8px] tracking-wider mt-4">Verified Identity (Aadhaar)</span>
                  <span className={`font-bold tracking-wider font-mono text-xs ${isDark ? "text-slate-200" : "text-blue-950"}`}>{profile.maskedAadhaar}</span>
                </div>

                <div className={`p-4 rounded-xl border space-y-1 bg-slate-50/50 dark:bg-slate-950 border-slate-150/60 dark:border-slate-850`}>
                  <span className="text-slate-500 font-bold block uppercase text-[8px] tracking-wider">Corporate Entity Profile</span>
                  {profile.organization ? (
                    <>
                      <span className={`font-bold block text-blue-950 font-sans text-xs`}>{profile.organization.organizationName}</span>
                      <span className="text-blue-900 font-mono font-bold block mt-1 text-[11px]">{profile.organization.gstin}</span>
                    </>
                  ) : (
                    <span className={`font-bold block ${isDark ? "text-slate-200" : "text-blue-950"}`}>Individual Seller Record</span>
                  )}
                </div>
              </div>
            </div>

            {/* BANK DETAILS */}
            {profile.bankAccount && (
              <div className={`border p-6 rounded-2xl space-y-4 ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
              }`}>
                <div className={`flex items-center justify-between border-b pb-3.5 ${
                  isDark ? "border-slate-850" : "border-slate-150"
                }`}>
                  <span className={`font-bold uppercase text-xs tracking-wider ${isDark ? "text-white" : "text-blue-950"}`}>
                    Linked Escrow Clearing Link
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold border bg-emerald-50 text-emerald-600 border-emerald-200`}>
                    ● Verified (Penny Drop Complete)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px]">
                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px] tracking-wider">Beneficiary</span>
                    <p className={`font-bold text-xs uppercase ${isDark ? "text-slate-200" : "text-blue-950"}`}>{profile.bankAccount.accountHolderName}</p>
                    <span className="text-slate-500 block mt-4 uppercase text-[8px] tracking-wider">Linked Settlement Bank</span>
                    <p className={`font-bold text-xs uppercase ${isDark ? "text-slate-200" : "text-blue-950"}`}>{profile.bankAccount.bankName} - {profile.bankAccount.maskedAccountNumber}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 block uppercase text-[8px] tracking-wider">IFSC Routing Code</span>
                    <p className="font-bold text-xs text-blue-900 font-mono tracking-widest">{profile.bankAccount.ifscCode}</p>
                    <span className="text-slate-500 block mt-4 uppercase text-[8px] tracking-wider">Branch Area</span>
                    <p className={`font-bold text-xs uppercase ${isDark ? "text-slate-200" : "text-blue-950"}`}>{profile.bankAccount.branchName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: SLA REVIEW & DOCUMENT STATUS */}
          <div className="space-y-6">
            {/* SLA INFO */}
            <div className={`border p-6 rounded-2xl space-y-4 h-fit ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider border-b pb-2 ${
                isDark ? "text-white border-slate-850" : "text-blue-950 border-slate-150"
              }`}>
                Onboarding SLA Turnaround
              </h3>

              <div className="space-y-4 text-[10px] leading-relaxed text-slate-500">
                <div className="flex gap-2">
                  <span className="font-bold text-blue-900 shrink-0">1.</span>
                  <p>Tax credentials and MCA corporate filings are checked instantly against statutory API logs.</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-blue-900 shrink-0">2.</span>
                  <p>Uploaded documents are cross-verified by compliance officers inside 4 working hours.</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-blue-900 shrink-0">3.</span>
                  <p>Once cleared, active bidding and trade billing allocations are instantly authorized.</p>
                </div>
              </div>
            </div>

            {/* Document upload checklist summary */}
            <div className={`border p-6 rounded-2xl space-y-4 h-fit ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider border-b pb-2 ${
                isDark ? "text-white border-slate-850" : "text-blue-950 border-slate-150"
              }`}>
                Dossier Upload Audit
              </h3>
              <div className="space-y-3">
                {profile.documents && profile.documents.length > 0 ? (
                  profile.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-600 font-sans truncate pr-2">{doc.documentType.replace(/_/g, " ")}</span>
                      <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase border bg-amber-50 text-amber-600 border-amber-200 inline-flex items-center gap-1">
                        <Clock className="h-2 w-2" /> Pending Audit
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400">All statutory uploads matched & verified.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      <AnimatePresence>
        {activePreviewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60" onClick={() => setActivePreviewDoc(null)} />
            <div className={`border max-w-lg w-full rounded-2xl p-6 relative z-10 space-y-4 ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-lg"
            }`}>
              <div className={`flex justify-between items-center border-b pb-3 ${
                isDark ? "border-slate-800" : "border-slate-150"
              }`}>
                <span className={`font-bold uppercase ${isDark ? "text-white" : "text-blue-950"}`}>{activePreviewDoc.name}</span>
                <button onClick={() => setActivePreviewDoc(null)} className="text-slate-400 hover:text-blue-950">Close</button>
              </div>

              {activePreviewDoc.url ? (
                <div className={`aspect-[4/3] rounded-xl overflow-hidden border flex items-center justify-center ${
                  isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}>
                  <img src={activePreviewDoc.url} alt="Proof" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className={`aspect-[4/3] rounded-xl border flex flex-col items-center justify-center gap-3 ${
                  isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}>
                  <FileText className="h-10 w-10 text-blue-900 animate-pulse" />
                  <p className={`font-bold uppercase ${isDark ? "text-slate-300" : "text-blue-950"}`}>DOCUMENT DIGITAL TWIN</p>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerRegistrationScreen;
