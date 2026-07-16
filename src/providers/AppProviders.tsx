import React, { ReactNode } from "react";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "../theme/ThemeProvider";
import { NotificationProvider } from "./NotificationProvider";
import { AuthProvider } from "../context/AuthContext";
import { WebSocketProvider } from "../context/WebSocketContext";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <WebSocketProvider>
                {children}
              </WebSocketProvider>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};
export default AppProviders;
