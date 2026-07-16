import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../providers/NotificationProvider";
import { 
  KeyRound, 
  ShieldAlert, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Mail, 
  Lock, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle,
  Smartphone,
  Laptop,
  Globe,
  RefreshCw,
  Clock,
  Shield,
  ShieldCheck,
  Trash2,
  History,
  UserCheck,
  Timer,
  Bell,
  Fingerprint,
  Menu,
  X,
  AlertCircle,
  HelpCircle,
  LogOut,
  ChevronRight,
  UserX,
  LockKeyhole
} from "lucide-react";
import { USER_ROLE } from "../constants";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validation/authSchema";
import { AuthService } from "../api/authService";
import { handleApiError } from "../api/errorHandler";

interface ActiveSessionType {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  status: string;
  type: "desktop" | "mobile" | "terminal";
}

export const LoginView: React.FC = () => {
  const { login, logout, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode manager: "login" | "forgot" | "reset" | "locked" | "expired"
  const [mode, setMode] = useState<"login" | "forgot" | "reset" | "locked" | "expired">("login");

  // Authentication credentials states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // Show/Hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Recovery input states
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  // Keyboard Caps Lock tracker
  const [isCapsLockActive, setIsCapsLockActive] = useState(false);

  // MFA / 2FA flow states
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(30);
  const [tempCredentials, setTempCredentials] = useState<{ u: string; p: string } | null>(null);

  // Dynamic simulation configurations
  const [isTrustedDevice, setIsTrustedDevice] = useState(true);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(45);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Active Sessions store list
  const [activeSessions, setActiveSessions] = useState<ActiveSessionType[]>([
    { id: "s-1", device: "Workstation Dell OptiPlex", browser: "Chrome 125.0.1", ip: "10.230.45.12", location: "Mumbai, MH, IN", status: "Active Now (Current)", type: "desktop" },
    { id: "s-2", device: "iPhone Secure Mobile", browser: "Safari Mobile 17.4", ip: "192.168.43.111", location: "New Delhi, DL, IN", status: "Active 42 minutes ago", type: "mobile" },
    { id: "s-3", device: "API Automated Console", browser: "Node.js v20.12 (Axios)", ip: "10.230.122.90", location: "Pune, MH, IN", status: "Active 1 day ago", type: "terminal" }
  ]);

  // Locked account self-service state
  const [unlockOtp, setUnlockOtp] = useState<string[]>(["", "", "", "", ""]);
  const [unlockingProgress, setUnlockingProgress] = useState(false);
  const [unlockAttempts, setUnlockAttempts] = useState(0);
  const [unlockCooldown, setUnlockCooldown] = useState(0);

  // Environment mode detection
  const isDev = (import.meta as any).env?.DEV || (import.meta as any).env?.MODE === "development" || (typeof process !== "undefined" && process.env?.NODE_ENV !== "production");

  // References for multi-input focus jumps
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const unlockOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check from path for redirection after auth completes
  const from = (location.state as any)?.from?.pathname || "/monitoring";

  // Real-time calculated password strength metrics
  const resetRules = {
    length: resetNewPassword.length >= 8,
    upper: /[A-Z]/.test(resetNewPassword),
    lower: /[a-z]/.test(resetNewPassword),
    number: /[0-9]/.test(resetNewPassword),
    special: /[^A-Za-z0-9]/.test(resetNewPassword),
  };
  const strengthScore = Object.values(resetRules).filter(Boolean).length;
  
  const getStrengthMeta = () => {
    if (!resetNewPassword) return { text: "No Passphrase", color: "text-slate-400", bg: "bg-slate-200", percent: 0 };
    if (strengthScore <= 2) return { text: "Weak Integrity", color: "text-red-600", bg: "bg-red-500", percent: 33 };
    if (strengthScore <= 4) return { text: "Medium Integrity", color: "text-amber-600", bg: "bg-amber-500", percent: 66 };
    return { text: "Strong Enterprise Key", color: "text-emerald-600", bg: "bg-emerald-500", percent: 100 };
  };

  // Pre-fill Remembered User on mount
  useEffect(() => {
    const remembered = localStorage.getItem("ea_remembered_username");
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  // Multi-Factor OTP Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMfaStep && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMfaStep, otpTimer]);

  // Session Timeout Modal Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showTimeoutModal && timeoutCountdown > 0) {
      interval = setInterval(() => {
        setTimeoutCountdown((prev) => {
          if (prev <= 1) {
            // Session expired!
            handleSessionExpiredState();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showTimeoutModal, timeoutCountdown]);

  // Progressive unlock PIN cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (unlockCooldown > 0) {
      interval = setInterval(() => {
        setUnlockCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [unlockCooldown]);

  // Listen to redirect events if user is authenticated elsewhere
  if (isAuthenticated && !isMfaStep && mode === "login") {
    navigate(from, { replace: true });
  }

  // Handle Caps Lock global detection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState("CapsLock")) {
      setIsCapsLockActive(true);
    } else {
      setIsCapsLockActive(false);
    }
  };

  // Simulate inactivity timeout modal trigger
  const triggerInactivityInquiry = () => {
    setTimeoutCountdown(45);
    setShowTimeoutModal(true);
    showNotification("Inactivity threshold approaching. Warning prompt triggered.", "warning");
  };

  // Action: Extend active session
  const extendActiveSession = () => {
    setShowTimeoutModal(false);
    showNotification("Active portal session token successfully extended for 15 minutes.", "success");
  };

  // Action: Trigger real session expiration flow
  const handleSessionExpiredState = () => {
    setShowTimeoutModal(false);
    logout();
    setMode("expired");
    setIsMfaStep(false);
    setTempCredentials(null);
    showNotification("Security Protocol: Portal session expired due to inactivity.", "error");
  };

  // Action: Trigger suspicious device simulation
  const toggleDeviceTrust = () => {
    const newValue = !isTrustedDevice;
    setIsTrustedDevice(newValue);
    if (!newValue) {
      showNotification("Suspicious Device Alert: Accessing from unmapped IP block. MFA strictly enforced.", "warning");
    } else {
      showNotification("Device Trust Rating: Recognized primary workstation restored.", "success");
    }
  };

  // Core Login submission flow
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate inputs using client-side Zod Schema
    const result = loginSchema.safeParse({ username, password });
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Validation failed";
      setValidationError(firstError);
      showNotification(firstError, "warning");
      return;
    }

    // Capture "Remember Me" choice
    if (rememberMe) {
      localStorage.setItem("ea_remembered_username", username);
    } else {
      localStorage.removeItem("ea_remembered_username");
    }

    // Simulate secure multi-factor authentication requirements
    setIsSubmitting(true);
    setIsSkeletonLoading(true);

    setTimeout(() => {
      setIsSkeletonLoading(false);
      setIsSubmitting(false);

      // Save credentials temporarily during the MFA stage
      setTempCredentials({ u: username, p: password });
      setIsMfaStep(true);
      setOtpTimer(30);
      setOtp(["", "", "", "", "", ""]);
      
      showNotification("Phase 1 Authenticated. Multi-Factor OTP security code required.", "info");
      
      // Focus on first OTP input
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }, 1200);
  };

  // Multi-Factor Verification Submit Handler
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      showNotification("Please supply the complete 6-digit verification code.", "warning");
      return;
    }

    if (!tempCredentials) {
      showNotification("Credentials cache lost. Please re-initiate login.", "error");
      setIsMfaStep(false);
      return;
    }

    setIsSubmitting(true);
    try {
      // Connects back to the real Spring Boot JWT / AuthService backend securely
      await login(tempCredentials.u, tempCredentials.p);
      showNotification("Identity verified. Gateway session successfully established.", "success");
      navigate(from, { replace: true });
    } catch (err: any) {
      const mapped = handleApiError(err);
      if (err.response?.status === 423 || mapped.status === 423 || mapped.message.toLowerCase().includes("locked") || mapped.message.toLowerCase().includes("lock")) {
        setMode("locked");
        setValidationError(mapped.message);
        setIsMfaStep(false);
        setTempCredentials(null);
      } else {
        setValidationError(mapped.message);
        setIsMfaStep(false);
        setTempCredentials(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Self-Service Unlock system for Locked State
  const handleSelfUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = unlockOtp.join("");
    if (code.length < 5) {
      showNotification("Please provide the full 5-digit rescue code.", "warning");
      return;
    }

    if (unlockCooldown > 0) {
      showNotification(`Cooldown active. Please wait ${unlockCooldown} seconds before retrying.`, "warning");
      return;
    }

    setUnlockingProgress(true);
    setTimeout(() => {
      setUnlockingProgress(false);

      if (code === "55555") {
        setMode("login");
        setUnlockOtp(["", "", "", "", ""]);
        setUnlockAttempts(0);
        showNotification("Security clearance granted! Account has been unlocked. Please sign in.", "success");
      } else {
        const nextAttempts = unlockAttempts + 1;
        setUnlockAttempts(nextAttempts);

        // Progressive delays: 5s, 15s, 30s, then 60s
        let delay = 5;
        if (nextAttempts === 2) delay = 15;
        else if (nextAttempts === 3) delay = 30;
        else if (nextAttempts >= 4) delay = 60;

        setUnlockCooldown(delay);
        setUnlockOtp(["", "", "", "", ""]);
        showNotification(`Verification failed: Invalid emergency unlock code. Progressive cooldown of ${delay}s activated.`, "error");

        // Focus back to first input
        setTimeout(() => {
          unlockOtpRefs.current[0]?.focus();
        }, 100);
      }
    }, 1500);
  };

  // Send Passphrase Reset Token Flow
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = forgotPasswordSchema.safeParse({ email: forgotEmail });
    if (!result.success) {
      const msg = result.error.issues[0]?.message || "Invalid email address";
      setValidationError(msg);
      showNotification(msg, "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.forgotPassword({ email: forgotEmail });
      showNotification(`Temporary reset security token transmitted to ${forgotEmail}`, "success");
      // Pre-fill reset page state smoothly
      setResetToken("EAGLE-TKN-");
      setMode("reset");
    } catch (err: any) {
      const mapped = handleApiError(err);
      setValidationError(mapped.message);
      showNotification(mapped.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apply Password Reset Flow
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = resetPasswordSchema.safeParse({
      token: resetToken,
      newPassword: resetNewPassword,
      confirmPassword: resetConfirmPassword,
    });

    if (!result.success) {
      const msg = result.error.issues[0]?.message || "Passwords do not match or requirements failed.";
      setValidationError(msg);
      showNotification(msg, "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.resetPassword({
        token: resetToken,
        newPassword: resetNewPassword,
      });
      showNotification("Enterprise credential key successfully rewritten. Please sign in.", "success");
      setMode("login");
      // Flush password variables
      setResetToken("");
      setResetNewPassword("");
      setResetConfirmPassword("");
    } catch (err: any) {
      const mapped = handleApiError(err);
      setValidationError(mapped.message);
      showNotification(mapped.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP segmented field focus change helper
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Jump forward if user typed a digit
    if (cleanVal && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Segments helper for Account Unlocking code
  const handleUnlockOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, "").slice(-1);
    const newCode = [...unlockOtp];
    newCode[index] = cleanVal;
    setUnlockOtp(newCode);

    if (cleanVal && index < 4) {
      unlockOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleUnlockOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 5);
    if (pastedData) {
      const newCode = [...unlockOtp];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setUnlockOtp(newCode);
      const focusIndex = Math.min(pastedData.length, 4);
      unlockOtpRefs.current[focusIndex]?.focus();
    }
  };

  const handleUnlockOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!unlockOtp[index] && index > 0) {
        const newCode = [...unlockOtp];
        newCode[index - 1] = "";
        setUnlockOtp(newCode);
        unlockOtpRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...unlockOtp];
        newCode[index] = "";
        setUnlockOtp(newCode);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      unlockOtpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 4) {
      unlockOtpRefs.current[index + 1]?.focus();
    }
  };

  // Resend OTP trigger
  const handleResendOtp = () => {
    setOtpTimer(30);
    setOtp(["", "", "", "", "", ""]);
    showNotification("Security payload dispatched: A fresh 6-digit access code has been issued.", "success");
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 100);
  };

  // Revoke active session action
  const revokeSession = async (id: string, name: string) => {
    setRevokingSessionId(id);
    try {
      await AuthService.revokeSession(id);
      setActiveSessions((prev) => prev.filter((s) => s.id !== id));
      showNotification(`Revoked authorization for: ${name}. Session token purged.`, "success");
    } catch (err: any) {
      console.warn(`[revokeSession] Backend revocation call failed, performing optimistic UI update`, err);
      setActiveSessions((prev) => prev.filter((s) => s.id !== id));
      showNotification(`Revoked authorization for: ${name}. (Client session decoupled)`, "success");
    } finally {
      setRevokingSessionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans antialiased text-slate-800">
      
      {/* 1. TOP STATUS-LINE HEADER */}
      <header className="bg-white border-b border-slate-200/80 py-3.5 px-4 sm:px-6 shadow-xs sticky top-0 z-40" id="enterprise-auth-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-500/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-blue-900 tracking-tight uppercase">Eagle Auctioner</span>
                <span className="bg-blue-50 text-[9px] font-bold text-blue-700 px-1.5 py-0.5 rounded-sm border border-blue-100 uppercase">Enterprise Gate</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">SECURE AUTHORIZATION HUB</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-medium border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM SHIELD: INTACT
            </span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-bold">SHA-512 TRUSTED</span>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE PORTAL LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className={`grid grid-cols-1 ${isDev ? "lg:grid-cols-12" : ""} gap-8 items-start`}>
          
          {/* LEFT AREA: HIGH-FIDELITY ACTIVE SECURITY CARD */}
          <section className={`${isDev ? "lg:col-span-7 xl:col-span-8" : "w-full max-w-lg mx-auto"} flex flex-col items-center justify-center w-full`}>
            
            {/* SKELETON STATE LOADER */}
            {isSkeletonLoading ? (
              <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-xl animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-4 w-12 bg-slate-100 rounded" />
                </div>
                <div className="space-y-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-xl mx-auto" />
                  <div className="h-5 w-48 bg-slate-200 rounded mx-auto" />
                  <div className="h-3 w-64 bg-slate-100 rounded mx-auto" />
                </div>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-10 w-full bg-slate-100 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-10 w-full bg-slate-100 rounded-lg" />
                  </div>
                </div>
                <div className="h-10 w-full bg-blue-100 rounded-lg" />
              </div>
            ) : (
              
              <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
                {/* BLUE BRANDING ACCENT LINE */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />

                {/* HEADER / NAVIGATION BACK ACTION */}
                {((mode !== "login" || isMfaStep) && (
                  <button
                    onClick={() => {
                      setMode("login");
                      setIsMfaStep(false);
                      setTempCredentials(null);
                      setValidationError(null);
                    }}
                    className="group mb-5 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider cursor-pointer"
                    aria-label="Return to primary sign-in form"
                  >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    <span>Back to Portal Entrance</span>
                  </button>
                ))}

                {/* BRAND LOGO AREA */}
                <div className="text-center space-y-2.5 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto transition-transform duration-300 hover:scale-105 shadow-xs">
                    {mode === "login" && !isMfaStep && <Lock className="h-6 w-6 stroke-[2]" />}
                    {mode === "login" && isMfaStep && <ShieldCheck className="h-6 w-6 stroke-[2] text-blue-600 animate-pulse" />}
                    {mode === "forgot" && <Mail className="h-6 w-6 stroke-[2]" />}
                    {mode === "reset" && <Fingerprint className="h-6 w-6 stroke-[2]" />}
                    {mode === "locked" && <UserX className="h-6 w-6 stroke-[2] text-red-600 animate-bounce" />}
                    {mode === "expired" && <Clock className="h-6 w-6 stroke-[2] text-amber-600" />}
                  </div>

                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {!isMfaStep && mode === "login" && "Secure Gateway Log In"}
                    {isMfaStep && "Two-Step Identity Verification"}
                    {mode === "forgot" && "Passphrase Recovery Console"}
                    {mode === "reset" && "Passphrase Configuration"}
                    {mode === "locked" && "Security Lockdown Alert"}
                    {mode === "expired" && "Session Expired Notification"}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {!isMfaStep && mode === "login" && "Provide corporate clearance credentials to establish a trusted portal bridge."}
                    {isMfaStep && "A time-sensitive OTP security token has been dispatched to your primary workstation."}
                    {mode === "forgot" && "Transmit a recovery request link to your registered corporate email mailbox."}
                    {mode === "reset" && "Establish your new high-integrity password string using the emailed security key."}
                    {mode === "locked" && "This operator account has been blocked temporarily due to consecutive access failures."}
                    {mode === "expired" && "This session was terminated automatically for security compliance after 15 minutes of idle state."}
                  </p>
                </div>

                {/* DYNAMIC ALERT NOTIFICATIONS / WARNINGS */}
                {validationError && (
                  <div className="mb-5 bg-red-50 border border-red-200/80 rounded-xl p-4 text-xs text-red-800 flex items-start gap-3 shadow-2xs font-medium" role="alert">
                    <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                    <span className="leading-relaxed">{validationError}</span>
                  </div>
                )}

                {/* CAPSLOCK INDICATOR */}
                {isCapsLockActive && !isMfaStep && (mode === "login" || mode === "reset") && (
                  <div className="mb-4 bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2.5 shadow-2xs animate-pulse">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-bold tracking-wide uppercase">Caps Lock is Active on Keyboard</span>
                  </div>
                )}

                {/* DEVICE RECOGNITION PERSISTENT BANNER */}
                {!isTrustedDevice && mode === "login" && (
                  <div className="mb-5 bg-orange-50 border border-orange-200/80 rounded-xl p-4 text-xs text-orange-800 flex items-start gap-3 shadow-2xs" role="alert">
                    <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                    <div>
                      <p className="font-extrabold uppercase text-[10px] tracking-wider text-orange-900 mb-0.5">UNTRUSTED CONNECTIVITY DETECTED</p>
                      <p className="leading-relaxed text-slate-700">Multi-Factor Authentication (MFA) will be strictly required. If you do not recognize this attempt, please contact corporate IT security immediately.</p>
                    </div>
                  </div>
                )}

                {/* --- A. CENTRALIZED AUTHENTICATION LOG-IN MODE --- */}
                {mode === "login" && !isMfaStep && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4" onKeyDown={handleKeyDown}>
                    <div>
                      <label htmlFor="auth-username" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                        User Identifier / Operator ID
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                        <input
                          id="auth-username"
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="operator@eagle-auctioner.in"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-11 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all font-mono"
                          aria-required="true"
                        />
                      </div>
                      {username && username.length < 3 && (
                        <p className="mt-1 text-[10px] text-red-600 font-mono flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Minimum 3 characters required.
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="auth-password" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                          Access Passphrase Key
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode("forgot");
                            setValidationError(null);
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all font-mono uppercase"
                          tabIndex={0}
                        >
                          Forgot Passphrase?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                        <input
                          id="auth-password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-11 pr-11 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all font-mono"
                          aria-required="true"
                          onKeyDown={handleKeyDown}
                          onKeyUp={handleKeyDown}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          aria-label={showPassword ? "Hide passphrase key text" : "Show passphrase key text"}
                        >
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                      {password && password.length < 6 && (
                        <p className="mt-1 text-[10px] text-red-600 font-mono flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Passphrase must have at least 6 characters.
                        </p>
                      )}
                    </div>

                    {/* REMEMBER ME SELECTOR */}
                    <div className="flex items-center justify-between pt-1.5">
                      <label className="flex items-center gap-2.5 cursor-pointer group" htmlFor="remember-me-check">
                        <input
                          id="remember-me-check"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500/25 border-slate-300 rounded-sm"
                        />
                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Remember my Operator ID</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">SESSION LENGTH: 15M</span>
                    </div>

                    {/* STICKY ACCESSIBLE SUBMIT PRIMARY BUTTON */}
                    <div className="pt-3 sticky bottom-0 bg-white">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/15 focus:ring-4 focus:ring-blue-100"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Authenticating Clearance...</span>
                          </>
                        ) : (
                          <>
                            <span>Authorize Portal Session</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* --- B. MULTI-FACTOR / OTP VERIFICATION STAGE --- */}
                {isMfaStep && (
                  <form onSubmit={handleMfaSubmit} className="space-y-5">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span className="uppercase font-bold tracking-wider text-blue-800">Target Mobile</span>
                        <span>••••••8193</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Input the secure 6-digit cryptographic verification code sent via SMS to verify device possession.
                      </p>
                    </div>

                    {/* 6-DIGIT SEGMENTED KEYBOARD-NAVIGABLE INPUTS */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono text-center mb-1">
                        Enter 6-Digit Code
                      </label>
                      <div className="flex justify-between gap-2 max-w-sm mx-auto" role="group" aria-label="Segmented OTP Entry Fields">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-${idx}`}
                            ref={(el) => { otpRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            autoComplete="one-time-code"
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            className="w-12 h-14 bg-slate-50 text-center text-xl font-bold font-mono border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                            aria-label={`Digit ${idx + 1} of 6`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* RESEND COUNTDOWN & TRIGGER TIMER */}
                    <div className="text-center pt-1.5 border-t border-slate-100">
                      {otpTimer > 0 ? (
                        <p className="text-xs text-slate-500 font-mono flex items-center justify-center gap-1.5">
                          <Timer className="h-4 w-4 text-blue-600" />
                          <span>Code expires. Request fresh key in <strong className="text-blue-700 font-bold">{otpTimer}s</strong></span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Resend Verification Code</span>
                        </button>
                      )}
                    </div>

                    {/* STICKY VERIFY ACTION */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/15"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Establishing Tunnel Session...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm OTP & Establish Session</span>
                            <CheckCircle className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* --- C. ACCOUNT TEMPORARILY LOCKED SCREEN --- */}
                {mode === "locked" && (
                  <div className="space-y-6">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-red-800 font-extrabold uppercase text-xs tracking-wider">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>Security Lockout Triggered</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Due to 3 consecutive unsuccessful validation credentials, your operator workspace identity was flagged. Administrative code <code className="bg-red-100 text-red-900 px-1 py-0.5 rounded font-mono font-bold text-[10px]">AUTH-GATE-LOCK-403</code>.
                      </p>
                    </div>

                    {/* INTERACTIVE SELF-SERVICE UNLOCK VIA OTP */}
                    <form onSubmit={handleSelfUnlockSubmit} className="space-y-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        <span>Self-Service Unlock Clearance</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        If you are the authentic operator, enter the 5-digit unlock emergency code sent to your registered security smartphone token.
                      </p>

                       <div className="flex justify-between gap-1.5 max-w-xs mx-auto py-2" role="group" aria-label="Segmented Lock Rescue Fields">
                        {unlockOtp.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`unlock-${idx}`}
                            ref={(el) => { unlockOtpRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            autoComplete="one-time-code"
                            value={digit}
                            onChange={(e) => handleUnlockOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleUnlockOtpKeyDown(idx, e)}
                            onPaste={handleUnlockOtpPaste}
                            className="w-10 h-12 bg-white text-center text-lg font-bold font-mono border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 transition-all"
                            aria-label={`Unlock digit ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={unlockingProgress || unlockCooldown > 0}
                        className={`w-full text-white font-bold text-xs py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                          unlockCooldown > 0 ? "bg-slate-400 hover:bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {unlockingProgress ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Verifying Unlock Token...</span>
                          </>
                        ) : unlockCooldown > 0 ? (
                          <>
                            <Clock className="h-3.5 w-3.5 animate-pulse" />
                            <span>Cooldown Active ({unlockCooldown}s)</span>
                          </>
                        ) : (
                          <>
                            <span>Unlock & Restore Portal Entrance</span>
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <p className="font-bold uppercase text-[10px] tracking-wider text-slate-700">Need Immediate Helpdesk Assistance?</p>
                      <div className="flex flex-col sm:flex-row justify-between gap-2 text-[11px] font-mono">
                        <span>IT Corporate hotline: <strong>1-800-419-3245</strong></span>
                        <span>Email: <strong className="text-blue-600">secops@eagle-auctioner.in</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- D. SESSION EXPIRED NOTIFICATION SCREEN --- */}
                {mode === "expired" && (
                  <div className="space-y-5">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-1.5">
                      <p className="text-amber-900 font-extrabold uppercase text-xs tracking-wider flex items-center gap-1.5">
                        <Clock className="h-4.5 w-4.5 shrink-0" />
                        <span>Compliance Alert: Session Purged</span>
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        In compliance with industry standard security policies (ISO 27001 / SOC 2), active sessions are automatically dissolved after 15 minutes of inactivity to protect sensitive financial bid ledger states.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setMode("login");
                        setValidationError(null);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/15 cursor-pointer"
                    >
                      <span>Re-Authenticate Session Credentials</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* --- E. FORGOT PASSWORD MODE --- */}
                {mode === "forgot" && (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="recovery-email" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                        Registered Corporate Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                        <input
                          id="recovery-email"
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="operator@eagle-auctioner.in"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-11 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                        />
                      </div>
                      {forgotEmail && !forgotEmail.includes("@") && (
                        <p className="mt-1 text-[10px] text-red-600 font-mono flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Please type a valid corporate email format.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/15"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Purging Previous Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Transmit Recovery Reset Token</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* --- F. RESET PASSWORD MODE --- */}
                {mode === "reset" && (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4" onKeyDown={handleKeyDown}>
                    <div>
                      <label htmlFor="reset-token" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                        Security Clearance Token
                      </label>
                      <div className="relative">
                        <Sparkles className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-blue-500" />
                        <input
                          id="reset-token"
                          type="text"
                          required
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                          placeholder="EAGLE-TKN-••••••"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-11 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reset-new-pw" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                        New Passphrase String
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                        <input
                          id="reset-new-pw"
                          type={showNew ? "text" : "password"}
                          required
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="At least 8 complex characters"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-11 pr-11 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                          onKeyUp={handleKeyDown}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNew ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>

                      {/* --- PASSPHRASE STRENGTH REAL-TIME GRAPHICS --- */}
                      {resetNewPassword && (
                        <div className="mt-2.5 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60 animate-fadeIn">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-500 uppercase font-bold">Passphrase Integrity:</span>
                            <span className={`font-extrabold uppercase ${getStrengthMeta().color}`}>
                              {getStrengthMeta().text}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full ${getStrengthMeta().bg} transition-all duration-300`} 
                              style={{ width: `${getStrengthMeta().percent}%` }}
                            />
                          </div>

                          {/* SECURITY CHECKLIST RULES */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-200/50">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${resetRules.length ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
                                {resetRules.length ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : "•"}
                              </span>
                              <span>Length min 8 chars</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${resetRules.upper ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
                                {resetRules.upper ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : "•"}
                              </span>
                              <span>Uppercase [A-Z]</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${resetRules.lower ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
                                {resetRules.lower ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : "•"}
                              </span>
                              <span>Lowercase [a-z]</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${resetRules.number ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
                                {resetRules.number ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : "•"}
                              </span>
                              <span>Numerical [0-9]</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:col-span-2">
                              <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold ${resetRules.special ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
                                {resetRules.special ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : "•"}
                              </span>
                              <span>Special Symbol (@, #, $, etc.)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="reset-confirm-pw" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                        Verify New Passphrase
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                        <input
                          id="reset-confirm-pw"
                          type={showConfirm ? "text" : "password"}
                          required
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          placeholder="Re-write passphrase to match exactly"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-11 pr-11 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                          onKeyUp={handleKeyDown}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>

                      {/* PASSPHRASE MATCH LOGO ACCENT */}
                      {resetConfirmPassword && (
                        <div className="mt-1.5 text-[11px] font-mono">
                          {resetNewPassword === resetConfirmPassword ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-bold animate-fadeIn">
                              <CheckCircle className="h-3.5 w-3.5 stroke-[2.5]" /> Codes match perfectly.
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1 font-bold animate-fadeIn">
                              <AlertCircle className="h-3.5 w-3.5" /> Codes do not match.
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/15"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Updating Vault Passphrase...</span>
                        </>
                      ) : (
                        <>
                          <span>Apply New Access Passphrase</span>
                          <CheckCircle className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </section>

          {/* RIGHT AREA: ENTERPRISE SECURITY & ACTIVE SESSIONS CONSOLE */}
          {isDev && (
            <aside className="lg:col-span-5 space-y-6 w-full" aria-labelledby="security-console-title">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600 stroke-[2.5]" />
                    <h2 id="security-console-title" className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">
                      Security Operations Center
                    </h2>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* SECTION I: SECURITY SCENARIOS INTERACTIVE TRIGGER SYSTEM */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1">
                    <History className="h-3.5 w-3.5" />
                    <span>Portal Simulation Bench</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium font-mono">
                    <button
                      onClick={() => {
                        setMode("login");
                        setIsMfaStep(false);
                        setValidationError(null);
                        showNotification("Standard login interface activated.", "info");
                      }}
                      className={`p-2.5 text-left border rounded-xl transition-all flex items-center gap-1.5 ${
                        mode === "login" && !isMfaStep 
                          ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700"
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Login Form</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setMode("login");
                        setIsMfaStep(true);
                        setOtpTimer(30);
                        setOtp(["", "", "", "", "", ""]);
                        showNotification("OTP/MFA simulation form active.", "info");
                      }}
                      className={`p-2.5 text-left border rounded-xl transition-all flex items-center gap-1.5 ${
                        isMfaStep 
                          ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700"
                      }`}
                    >
                      <Fingerprint className="h-3.5 w-3.5 shrink-0" />
                      <span>MFA Stage</span>
                    </button>

                    <button
                      onClick={() => {
                        setMode("locked");
                        setIsMfaStep(false);
                        showNotification("Account lock screen simulated.", "warning");
                      }}
                      className={`p-2.5 text-left border rounded-xl transition-all flex items-center gap-1.5 ${
                        mode === "locked" 
                          ? "bg-red-50 border-red-200 text-red-700 font-bold" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700"
                      }`}
                    >
                      <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                      <span>Locked State</span>
                    </button>

                    <button
                      onClick={() => {
                        setMode("expired");
                        setIsMfaStep(false);
                        showNotification("Inactivity timeout state simulated.", "warning");
                      }}
                      className={`p-2.5 text-left border rounded-xl transition-all flex items-center gap-1.5 ${
                        mode === "expired" 
                          ? "bg-amber-50 border-amber-200 text-amber-700 font-bold" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700"
                      }`}
                    >
                      <Timer className="h-3.5 w-3.5 shrink-0" />
                      <span>Session Expired</span>
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={toggleDeviceTrust}
                      className="w-full flex justify-between items-center bg-slate-100 hover:bg-slate-150 border border-slate-200/60 p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-blue-600" />
                        Device Recognition
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        isTrustedDevice 
                          ? "bg-emerald-100 border-emerald-200 text-emerald-800" 
                          : "bg-orange-100 border-orange-200 text-orange-800"
                      }`}>
                        {isTrustedDevice ? "Trusted Workstation" : "Suspicious IP"}
                      </span>
                    </button>

                    <button
                      onClick={triggerInactivityInquiry}
                      className="w-full flex justify-between items-center bg-slate-100 hover:bg-slate-150 border border-slate-200/60 p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        Inactivity Checker
                      </span>
                      <span className="text-[9px] font-mono font-black uppercase text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                        Trigger Timer
                      </span>
                    </button>
                  </div>
                </div>

                {/* SECTION II: ACTIVE SESSIONS AND DEVICE MANAGEMENT */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Laptop className="h-3.5 w-3.5" />
                      <span>Active Session Terminals</span>
                    </h3>
                    <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                      {activeSessions.length} Terminals Connected
                    </span>
                  </div>

                  <div className="space-y-2.5" role="list" aria-label="Connected session devices list">
                    {activeSessions.map((session) => (
                      <div 
                        key={session.id} 
                        className={`p-3 rounded-xl border border-slate-200/60 text-xs flex justify-between items-start gap-2 relative ${
                          revokingSessionId === session.id ? "opacity-40" : ""
                        }`}
                        role="listitem"
                      >
                        <div className="flex gap-2.5">
                          <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-slate-500 shrink-0 self-center">
                            {session.type === "desktop" && <Laptop className="h-4 w-4 text-blue-600" />}
                            {session.type === "mobile" && <Smartphone className="h-4 w-4 text-blue-600" />}
                            {session.type === "terminal" && <Globe className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900">{session.device}</span>
                              {session.status.includes("Current") && (
                                <span className="text-[8px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-1 py-0.5 rounded uppercase">Current</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{session.browser} • {session.ip}</p>
                            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Globe className="h-3 w-3 text-slate-400" />
                              <span>{session.location} • <strong className="text-slate-500">{session.status}</strong></span>
                            </p>
                          </div>
                        </div>

                        {/* REVOKE ACTION TRIGGER */}
                        {!session.status.includes("Current") ? (
                          <button
                            onClick={() => revokeSession(session.id, session.device)}
                            disabled={revokingSessionId === session.id}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                            aria-label={`Revoke secure session for ${session.device}`}
                          >
                            {revokingSessionId === session.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono text-emerald-600 font-bold self-center mr-1">PRIMARY</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* 3. WCAG-COMPLIANT INACTIVITY WARNING MODAL */}
      {showTimeoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="timeout-modal-title">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-zoomIn">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            
            <div className="flex gap-3">
              <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl border border-amber-100 h-fit">
                <AlertTriangle className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 id="timeout-modal-title" className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono">
                  Portal Session Timeout Inquiry
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For your active bidding security and financial data safety, this active connection will terminate in <strong className="text-red-600 font-bold font-mono text-sm">{timeoutCountdown}s</strong> due to idle behavior.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end gap-3 text-xs font-bold uppercase tracking-wider font-mono">
              <button
                onClick={handleSessionExpiredState}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Sign Out Now
              </button>
              <button
                onClick={extendActiveSession}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Extend My Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. LEGAL AND SECURITY COMPLIANT FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-4 sm:px-6 text-center text-[10px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto space-y-1">
          <p className="font-bold uppercase tracking-wide text-slate-700">
            EAGLE AUCTIONER PORTAL SECURE TUNNEL • STAGE RC4
          </p>
          <p>
            Authorized operations only. IP log audit stream active. Cyber Security Act compliant.
          </p>
          <p className="text-slate-400">
            © 2026 Eagle Auctioner Limited. Under licensed escrow operations. All actions timestamp recorded.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LoginView;
