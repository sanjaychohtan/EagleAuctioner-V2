import React, { memo } from "react";
import { ShieldCheck, RefreshCw, X } from "lucide-react";

interface MfaChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  otp: string[];
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  otpTimer: number;
  onVerify: () => void;
  onResend: () => void;
  isSubmitting: boolean;
}

export const MfaChallengeModal: React.FC<MfaChallengeModalProps> = memo(({
  isOpen,
  onClose,
  otp,
  setOtp,
  otpTimer,
  onVerify,
  onResend,
  isSubmitting
}) => {
  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`mfa-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono">
      <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Two-Factor Authentication</h3>
              <p className="text-[10px] text-slate-400">Enter the 6-digit code sent to your device</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`mfa-otp-${idx}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              className="w-11 h-12 text-center text-lg font-bold bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500 text-white"
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Resend code in <strong className="text-blue-400">{otpTimer}s</strong></span>
          <button
            onClick={onResend}
            disabled={otpTimer > 0}
            className="text-blue-400 hover:underline disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Resend OTP</span>
          </button>
        </div>

        <button
          onClick={onVerify}
          disabled={isSubmitting || otp.some(d => !d)}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/20"
        >
          {isSubmitting ? "Verifying..." : "Verify & Complete Login"}
        </button>
      </div>
    </div>
  );
});

MfaChallengeModal.displayName = "MfaChallengeModal";
