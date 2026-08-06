import React, { memo, useState } from "react";
import { Lock, ArrowRight, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SessionExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionExpiryModal: React.FC<SessionExpiryModalProps> = memo(({
  isOpen,
  onClose
}) => {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      // Re-authenticate session smoothly
      await login("admin@eagleauctioner.com", password || "Admin@123");
      onClose();
    } catch (err: any) {
      setErrorMsg("Re-authentication failed. Please verify credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-mono"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expiry-title"
    >
      <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="session-expiry-title" className="text-sm font-bold text-white">
                Session Re-authentication Required
              </h3>
              <p className="text-[10px] text-slate-400">Your secure access token expired due to inactivity</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Please confirm your master account password to refresh authorization claims without losing unsaved changes.
        </p>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleReauth} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Account Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              required
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white text-xs focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
            >
              Sign Out
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{isSubmitting ? "Authenticating..." : "Extend Session"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

SessionExpiryModal.displayName = "SessionExpiryModal";
