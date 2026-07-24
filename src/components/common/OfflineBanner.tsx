import React, { memo } from "react";
import { WifiOff, RotateCw } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export const OfflineBanner: React.FC = memo(() => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div 
      role="alert" 
      aria-live="assertive" 
      className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white font-mono px-4 py-2 text-xs flex items-center justify-between shadow-lg"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 animate-bounce shrink-0" aria-hidden="true" />
          <span>
            <strong>Connection Lost:</strong> You are currently offline. Live auction streams and bids are paused.
          </span>
        </div>
        <button
          onClick={handleRetry}
          className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <RotateCw className="h-3 w-3" />
          <span>Reconnect Now</span>
        </button>
      </div>
    </div>
  );
});

OfflineBanner.displayName = "OfflineBanner";
