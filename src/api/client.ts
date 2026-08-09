import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { envConfig } from "../config/env";
import { STORAGE_KEYS } from "../constants";
import { useAuthStore } from "../store/useAuthStore";
import { auditLogger } from "../utils/auditLogger";

// Interface for managing the token refresh queue
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: envConfig.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
  timeout: 15000, // 15 seconds SLA
});

// Request interceptor: Inject Access Token & Tenant ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken || localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const tenantId = useAuthStore.getState().tenantId || localStorage.getItem(STORAGE_KEYS.TENANT_ID);

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId && !config.headers["X-Tenant-Id"]) {
      config.headers["X-Tenant-Id"] = tenantId;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Silent JWT Refresh with Queue Lock
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/me");

    // Check if the error is 401 and we haven't retried yet and it is not an auth route
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue the request while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = useAuthStore.getState().refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        // Request token renewal from authentication controller
        const response = await axios.post(`${envConfig.apiBaseUrl}/v1/auth/refresh`, 
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {}, 
          { withCredentials: true }
        );

        const data = response.data?.data || response.data;
        const accessToken = data.accessToken;
        const newRefreshToken = data.refreshToken || data.newRefreshToken || storedRefreshToken;

        if (!accessToken) {
          throw new Error("Invalid token refresh payload received");
        }

        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuthData(accessToken, newRefreshToken, currentUser);
        } else {
          useAuthStore.setState({ accessToken, refreshToken: newRefreshToken });
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          if (newRefreshToken) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }
        }

        apiClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        auditLogger.log("TOKEN_REFRESH_SUCCESS", { details: `Refreshed token for route: ${originalRequest.url}` });
        processQueue(null, accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        auditLogger.log("TOKEN_REFRESH_FAILED", { details: refreshError?.message || "Refresh request failed" });
        processQueue(refreshError, null);
        isRefreshing = false;
        clearAuthData();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      auditLogger.log("UNAUTHORIZED_ACCESS", { details: `Forbidden 403 response on ${originalRequest.url}` });
      window.dispatchEvent(new Event("forbidden_redirect"));
    }

    return Promise.reject(error);
  }
);

const clearAuthData = () => {
  useAuthStore.getState().clearAuthData();
  window.dispatchEvent(new Event("unauthorized_redirect"));
};
