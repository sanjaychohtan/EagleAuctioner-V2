import React, { memo } from "react";
import { Sparkles } from "lucide-react";

interface DemoCredentialsBarProps {
  onSelectRole: (username: string, password: string) => void;
}

export const DemoCredentialsBar: React.FC<DemoCredentialsBarProps> = memo(({ onSelectRole }) => {
  const demoUsers = [
    { label: "Super Admin", user: "admin@eagleauctioner.com", pass: "Admin@123" },
    { label: "Seller", user: "demo.seller@eagleauctioner.com", pass: "DemoSeller@123" },
    { label: "Buyer", user: "demo.buyer@eagleauctioner.com", pass: "DemoBuyer@123" },
    { label: "Finance", user: "finance@eagleauctioner.com", pass: "Finance@123" },
    { label: "Operations", user: "ops@eagleauctioner.com", pass: "Ops@123" }
  ];

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5 font-mono">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        <span>Demo Credentials Quick Fill</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {demoUsers.map((u) => (
          <button
            key={u.user}
            type="button"
            onClick={() => onSelectRole(u.user, u.pass)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
          >
            {u.label}
          </button>
        ))}
      </div>
    </div>
  );
});

DemoCredentialsBar.displayName = "DemoCredentialsBar";
