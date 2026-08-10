import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, sanitizeRedirectUrl } from "../context/AuthContext";
import { useNotification } from "../providers/NotificationProvider";
import { handleApiError } from "../api/errorHandler";

import { DemoCredentialsBar } from "../components/auth/DemoCredentialsBar";
import { MfaChallengeModal } from "../components/auth/MfaChallengeModal";
import { LoginCredentialsForm } from "../components/auth/LoginCredentialsForm";
import { Gavel } from "lucide-react";

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showNotification } = useNotification();

  const [username, setUsername] = useState("admin@eagleauctioner.com");
  const [password, setPassword] = useState("Admin@123");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginTab, setLoginTab] = useState<"PASSWORD" | "OTP">("PASSWORD");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 2FA MFA modal state
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [otpArray, setOtpArray] = useState<string[]>(["", "", "", "", "", ""]);

  const handleSelectDemoRole = (email: string, pass: string) => {
    setUsername(email);
    setPassword(pass);
    setValidationError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!username || (!password && loginTab === "PASSWORD")) {
      setValidationError("Please fill out all required credentials.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userDto = await login(username, password);
      showNotification(`Welcome back, ${userDto.username}!`, "success");
      
      // Check redirect target
      const rawFrom = (location.state as any)?.from?.pathname;
      const targetPath = sanitizeRedirectUrl(rawFrom);
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      const friendly = handleApiError(err);
      setValidationError(friendly.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyMfa = () => {
    if (otpArray.join("").length !== 6) {
      showNotification("OTP must be 6 digits", "warning");
      return;
    }
    showNotification("MFA Code verified successfully", "success");
    setShowMfaModal(false);
    navigate("/monitoring");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2 font-mono">
          <div className="flex items-center justify-center mx-auto mb-2">
            <img src="/auctbiz-logo.png" alt="AUCTBIZ Logo" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">AUCTBIZ</h1>
          <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">WHERE INDUSTRY MEETS OPPORTUNITY</p>
        </div>

        {/* Demo Quick Roles Bar */}
        <DemoCredentialsBar onSelectRole={handleSelectDemoRole} />

        {/* Credentials Form */}
        <LoginCredentialsForm
          loginTab={loginTab}
          setLoginTab={setLoginTab}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isSubmitting={isSubmitting}
          validationError={validationError}
          onLoginSubmit={handleLoginSubmit}
          onOpenForgotPassword={() => showNotification("Contact system admin for password reset", "info")}
          onOpenSignUp={(role) => navigate(`/onboarding?role=${role}`)}
        />
      </div>

      {/* Footer copyright */}
      <footer className="text-center text-[10px] font-mono text-slate-600 py-4">
        &copy; 2026 AUCTBIZ Technologies. All rights reserved. ISO 27001 Certified.
      </footer>

      {/* MFA Modal */}
      <MfaChallengeModal
        isOpen={showMfaModal}
        onClose={() => setShowMfaModal(false)}
        otp={otpArray}
        setOtp={setOtpArray}
        otpTimer={60}
        onVerify={handleVerifyMfa}
        onResend={() => showNotification("Resent 6-digit OTP code", "info")}
        isSubmitting={false}
      />
    </div>
  );
};

export default LoginView;
