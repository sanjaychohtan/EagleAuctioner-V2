import React, { memo } from "react";

export interface SkeletonLoaderProps {
  variant?: "card" | "table-row" | "text" | "avatar" | "form-input";
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = memo(({
  variant = "text",
  count = 1,
  className = ""
}) => {
  const items = Array.from({ length: count });

  if (variant === "card") {
    return (
      <div 
        role="status" 
        aria-busy="true" 
        aria-label="Loading content..."
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {items.map((_, i) => (
          <div 
            key={i} 
            className={`p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-4 ${className}`}
          >
            <div className="h-4 w-1/3 bg-slate-800 rounded-md" />
            <div className="h-8 w-2/3 bg-slate-800 rounded-lg" />
            <div className="h-3 w-full bg-slate-800/60 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table-row") {
    return (
      <div 
        role="status" 
        aria-busy="true" 
        aria-label="Loading table records..."
        className="space-y-3 w-full"
      >
        {items.map((_, i) => (
          <div 
            key={i} 
            className={`flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 animate-pulse gap-4 ${className}`}
          >
            <div className="h-4 w-1/4 bg-slate-800 rounded" />
            <div className="h-4 w-1/4 bg-slate-800 rounded" />
            <div className="h-4 w-1/6 bg-slate-800 rounded" />
            <div className="h-6 w-16 bg-slate-800 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form-input") {
    return (
      <div 
        role="status" 
        aria-busy="true" 
        aria-label="Loading form field..."
        className={`space-y-2 animate-pulse ${className}`}
      >
        <div className="h-3 w-24 bg-slate-800 rounded" />
        <div className="h-10 w-full bg-slate-900 border border-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div 
      role="status" 
      aria-busy="true" 
      aria-label="Loading..."
      className="space-y-2"
    >
      {items.map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-slate-800/80 rounded animate-pulse ${className || "w-full"}`} 
        />
      ))}
    </div>
  );
});

SkeletonLoader.displayName = "SkeletonLoader";
