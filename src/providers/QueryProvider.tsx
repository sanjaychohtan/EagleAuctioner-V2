import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface QueryProviderProps {
  children: ReactNode;
}

// Instantiate QueryClient with sensible default configurations for enterprise SLAs
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent aggressive background requests on tab switching
      retry: (failureCount, error: any) => {
        // Do not retry on client errors (like 400, 401, 403, 404)
        if (error?.response?.status && error.response.status < 500) {
          return false;
        }
        return failureCount < 2; // Only retry twice for server errors
      },
      staleTime: 1000 * 30, // Data remains fresh for 30 seconds
    },
  },
});

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
