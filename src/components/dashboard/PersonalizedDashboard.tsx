import React, { useState } from "react";
import { Sparkles, Settings2 } from "lucide-react";
import { QuickActionsBar } from "./QuickActionsBar";
import { WalletWidget } from "./WalletWidget";
import { AIInsights } from "./AIInsights";
import { EnterpriseCalendar } from "./EnterpriseCalendar";
import { SystemHealth } from "./SystemHealth";
import { ActivityTimeline } from "./ActivityTimeline";
import { ExportCenter } from "./ExportCenter";
import { WidgetPreferencesDrawer } from "./personalized/WidgetPreferencesDrawer";
import { useAppStore } from "../../store/useAppStore";

export interface PersonalizedDashboardProps {
  simulationMode?: "normal" | "loading" | "empty" | "error";
  themeMode?: "light" | "dark";
  showToast?: (message: string, type?: "success" | "info" | "warning") => void;
  onTriggerAction?: (actionName: string, payload?: any) => void;
}

export function PersonalizedDashboard({
  simulationMode = "normal",
  themeMode = "dark",
  showToast = () => {},
  onTriggerAction = () => {}
}: PersonalizedDashboardProps) {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const { widgets, toggleWidget, resetWidgets } = useAppStore();

  const isEnabled = (id: string) => widgets.find((w) => w.id === id)?.enabled ?? true;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Personalized Cockpit Workspace
          </h2>
          <p className="text-xs text-slate-400">Tailored real-time telemetry and task controls</p>
        </div>

        <button
          onClick={() => setIsPreferencesOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-800 flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Settings2 className="h-4 w-4 text-blue-400" />
          <span>Customize Widgets</span>
        </button>
      </div>

      {/* Widgets Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {isEnabled("w-quick") && (
          <div className="lg:col-span-12">
            <QuickActionsBar themeMode={themeMode} showToast={showToast} onTriggerAction={onTriggerAction} />
          </div>
        )}

        {isEnabled("w-wallet") && (
          <div className="lg:col-span-4">
            <WalletWidget themeMode={themeMode} showToast={showToast} onTriggerAction={onTriggerAction} />
          </div>
        )}

        {isEnabled("w-ai") && (
          <div className="lg:col-span-8">
            <AIInsights themeMode={themeMode} showToast={showToast} />
          </div>
        )}

        {isEnabled("w-calendar") && (
          <div className="lg:col-span-6">
            <EnterpriseCalendar themeMode={themeMode} showToast={showToast} />
          </div>
        )}

        {isEnabled("w-system") && (
          <div className="lg:col-span-6">
            <SystemHealth themeMode={themeMode} showToast={showToast} />
          </div>
        )}

        {isEnabled("w-timeline") && (
          <div className="lg:col-span-7">
            <ActivityTimeline themeMode={themeMode} showToast={showToast} />
          </div>
        )}

        {isEnabled("w-export") && (
          <div className="lg:col-span-5">
            <ExportCenter themeMode={themeMode} showToast={showToast} />
          </div>
        )}
      </div>

      {/* Preferences Customizer Drawer */}
      <WidgetPreferencesDrawer
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        widgets={widgets}
        onToggleWidget={toggleWidget}
        onResetLayout={resetWidgets}
      />
    </div>
  );
}

export default PersonalizedDashboard;
