import { useEffect, useRef } from "react";

interface UseIdleTimerOptions {
  timeoutMs?: number; // Total idle duration before timeout (default 15 mins)
  warningMs?: number; // Duration before timeout to show warning (default 14 mins)
  onWarning?: () => void;
  onTimeout: () => void;
  enabled?: boolean;
}

export function useIdleTimer({
  timeoutMs = 15 * 60 * 1000,
  warningMs = 14 * 60 * 1000,
  onWarning,
  onTimeout,
  enabled = true,
}: UseIdleTimerOptions) {
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onWarningRef = useRef(onWarning);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onWarningRef.current = onWarning;
    onTimeoutRef.current = onTimeout;
  }, [onWarning, onTimeout]);

  const resetTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

    if (!enabled) return;

    if (warningMs < timeoutMs && onWarningRef.current) {
      warningTimerRef.current = setTimeout(() => {
        onWarningRef.current?.();
      }, warningMs);
    }

    timeoutTimerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);
  };

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleUserActivity = () => {
      resetTimers();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    resetTimers();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };
  }, [enabled, timeoutMs, warningMs]);

  return { resetTimers };
}
