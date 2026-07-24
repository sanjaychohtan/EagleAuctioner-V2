import React, { memo } from "react";
import { Sparkles } from "lucide-react";
import { USER_ROLE } from "../../constants";

interface DemoCredentialsBarProps {
  onSelectRole: (username: string, role: string) => void;
}

export const DemoCredentialsBar: React.FC<DemoCredentialsBarProps> = memo(({ onSelectRole }) => {
  const demoUsers = [
    { label: "Super Admin", role: USER_ROLE.SUPER_ADMIN, user: "admin@eagleauctioner.com" },
    { label: "Seller", role: USER_ROLE.SELLER, user: "seller@eagleauctioner.com" },
    { label: "Buyer", role: USER_ROLE.BUYER, user: "buyer@eagleauctioner.com" },
    { label: "Finance", role: USER_ROLE.FINANCE, user: "finance@eagleauctioner.com" },
    { label: "Operations", role: USER_ROLE.OPERATIONS, user: "ops@eagleauctioner.com" }
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
            key={u.role}
            type="button"
            onClick={() => onSelectRole(u.user, u.role)}
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
