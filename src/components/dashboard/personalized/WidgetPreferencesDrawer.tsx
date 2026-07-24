import React, { memo } from "react";
import { X, Check } from "lucide-react";

interface WidgetItem {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
}

interface WidgetPreferencesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetItem[];
  onToggleWidget: (id: string) => void;
  onResetLayout: () => void;
}

export const WidgetPreferencesDrawer: React.FC<WidgetPreferencesDrawerProps> = memo(({
  isOpen,
  onClose,
  widgets,
  onToggleWidget,
  onResetLayout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm font-mono">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 h-full flex flex-col justify-between shadow-2xl text-slate-100 space-y-6">
        <div className="space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Customize Cockpit Layout</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Enable or disable widget tiles according to your daily operations role.
          </p>

          <div className="space-y-2 pt-2">
            {widgets.map((w) => (
              <button
                key={w.id}
                onClick={() => onToggleWidget(w.id)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-xs ${
                  w.enabled
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-300"
                    : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                }`}
              >
                <div>
                  <span className="font-bold block">{w.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{w.category}</span>
                </div>
                <div className={`h-5 w-5 rounded-md flex items-center justify-center border ${
                  w.enabled ? "bg-blue-600 border-blue-500 text-white" : "border-slate-800"
                }`}>
                  {w.enabled && <Check className="h-3 w-3" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          <button
            onClick={onResetLayout}
            className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Reset Default Layout
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Apply Layout
          </button>
        </div>
      </div>
    </div>
  );
});

WidgetPreferencesDrawer.displayName = "WidgetPreferencesDrawer";
