import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message, type };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 active toasts

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  }, [dismissNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification }}>
      {children}

      {/* ACCESSIBLE MULTI-TOAST CONTAINER */}
      <div 
        role="region" 
        aria-label="Notifications" 
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none font-mono"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`p-3.5 rounded-2xl border shadow-xl flex items-center justify-between gap-3 pointer-events-auto text-xs ${
                toast.type === "success" 
                  ? "bg-slate-900 border-emerald-500/30 text-emerald-300" 
                  : toast.type === "error"
                  ? "bg-slate-900 border-red-500/30 text-red-300"
                  : toast.type === "warning"
                  ? "bg-slate-900 border-amber-500/30 text-amber-300"
                  : "bg-slate-900 border-blue-500/30 text-blue-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                {toast.type === "error" && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
                {toast.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                {toast.type === "info" && <Info className="h-4 w-4 text-blue-400 shrink-0" />}
                <span className="font-semibold leading-snug">{toast.message}</span>
              </div>

              <button
                type="button"
                onClick={() => dismissNotification(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
