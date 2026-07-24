import React, { memo } from "react";
import { LucideIcon, Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = memo(({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}) => {
  return (
    <div 
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 font-mono space-y-4 ${className}`}
    >
      <div className="h-12 w-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
});

EmptyState.displayName = "EmptyState";
