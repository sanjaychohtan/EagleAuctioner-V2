import React, { memo } from "react";
import { AlertCircle, RotateCw } from "lucide-react";

export interface InlineErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const InlineErrorState: React.FC<InlineErrorStateProps> = memo(({
  title = "Failed to load section data",
  message,
  onRetry,
  isRetrying = false,
  className = ""
}) => {
  return (
    <div 
      role="alert"
      aria-live="assertive"
      className={`p-5 rounded-2xl bg-red-500/10 border border-red-500/20 font-mono space-y-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 flex-1">
          <h4 className="text-xs font-bold text-red-300">{title}</h4>
          <p className="text-[11px] text-red-200/80 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Retrying..." : "Retry Connection"}</span>
          </button>
        </div>
      )}
    </div>
  );
});

InlineErrorState.displayName = "InlineErrorState";
