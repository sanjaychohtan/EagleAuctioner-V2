import React, { memo } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

interface LoginCredentialsFormProps {
  loginTab: "PASSWORD" | "OTP";
  setLoginTab: (tab: "PASSWORD" | "OTP") => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isSubmitting: boolean;
  validationError: string | null;
  onLoginSubmit: (e: React.FormEvent) => void;
  onOpenForgotPassword: () => void;
}

export const LoginCredentialsForm: React.FC<LoginCredentialsFormProps> = memo(({
  loginTab,
  setLoginTab,
  username,
  setUsername,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  showPassword,
  setShowPassword,
  isSubmitting,
  validationError,
  onLoginSubmit,
  onOpenForgotPassword
}) => {
  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl font-mono space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setLoginTab("PASSWORD")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              loginTab === "PASSWORD" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => setLoginTab("OTP")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              loginTab === "OTP" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Mobile OTP Login
          </button>
        </div>
      </div>

      {validationError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {validationError}
        </div>
      )}

      <form onSubmit={onLoginSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Corporate Email / Account ID *
          </label>
          <div className="relative">
            <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user@eagleauctioner.com"
              required
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {loginTab === "PASSWORD" ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Password *
              </label>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-[10px] text-blue-400 hover:underline font-bold cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] leading-relaxed">
            An SMS OTP will be dispatched to your registered mobile number upon clicking submit.
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
            />
            <span>Remember session on device</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{isSubmitting ? "Authenticating..." : "Authorize Access"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
});

LoginCredentialsForm.displayName = "LoginCredentialsForm";
