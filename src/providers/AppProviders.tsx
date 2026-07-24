import React, { ReactNode } from "react";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "../theme/ThemeProvider";
import { NotificationProvider } from "./NotificationProvider";
import { AuthProvider } from "../context/AuthContext";
import { WebSocketProvider } from "../context/WebSocketContext";
import { OfflineBanner } from "../components/common/OfflineBanner";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <QueryProvider>
              <WebSocketProvider>
                <OfflineBanner />
                {children}
              </WebSocketProvider>
            </QueryProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
export default AppProviders;
