import React, { useState, useEffect } from "react";

/**
 * Module-level flag to ensure the 5-second animated splash screen renders
 * ONLY on initial application load or browser refresh, NOT on internal React route changes.
 */
let hasInitialSplashRendered = false;

export const AuctbizSplashScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [showSplash, setShowSplash] = useState<boolean>(() => !hasInitialSplashRendered);

  useEffect(() => {
    if (hasInitialSplashRendered) {
      if (onComplete) onComplete();
      return;
    }

    hasInitialSplashRendered = true;

    const timer = setTimeout(() => {
      setShowSplash(false);
      if (onComplete) onComplete();
    }, 5000); // EXACTLY 5 SECONDS DURATION

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!showSplash) {
    return null;
  }

  return (
    <div
      id="auctbiz-splash-screen"
      className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col items-center justify-center p-6 select-none overflow-hidden animate-splash-container"
      aria-label="AUCTBIZ Application Initializing"
      role="dialog"
      aria-modal="true"
    >
      {/* Background ambient radial glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px] animate-splash-pulse" />
        <div className="w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[80px] animate-splash-pulse" style={{ animationDelay: "1s" }} />
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Center Container for Animated Logo and Brand Tagline */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg text-center space-y-6 animate-splash-logo">
        
        {/* Logo Container with Metallic Shine Sweep */}
        <div className="relative flex items-center justify-center p-4">
          <div className="relative overflow-hidden rounded-2xl p-2">
            <img
              src="/auctbiz-logo.png"
              alt="AUCTBIZ Logo"
              className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-[0_10px_25px_rgba(99,102,241,0.35)]"
            />
            {/* Glossy sweep line animation */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-splash-shine pointer-events-none" />
          </div>
        </div>

        {/* Brand Title Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[0.2em] text-white font-mono uppercase drop-shadow-md">
            AUCTBIZ
          </h1>
          
          {/* Animated Tagline */}
          <div className="flex items-center justify-center gap-3 font-mono text-[10px] sm:text-xs text-blue-400 font-bold uppercase tracking-[0.25em] animate-splash-tagline">
            <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-blue-500/60 hidden sm:inline-block" />
            <span>WHERE INDUSTRY MEETS OPPORTUNITY</span>
            <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-blue-500/60 hidden sm:inline-block" />
          </div>
        </div>

        {/* Minimal Progress Line Indicator */}
        <div className="w-48 sm:w-64 h-[2px] bg-slate-900 rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-blue-400 to-emerald-400 rounded-full w-full origin-left transition-transform duration-[4800ms] ease-out scale-x-100" />
        </div>
      </div>

      {/* Footer System Telemetry Note */}
      <div className="absolute bottom-6 text-[10px] font-mono text-slate-500 tracking-wider uppercase">
        ISO 27001 SECURE ENTERPRISE PLATFORM &bull; 2026
      </div>
    </div>
  );
};

export default AuctbizSplashScreen;
