import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { envConfig } from "../config/env";
import { STORAGE_KEYS } from "../constants";
import { useAuthStore } from "../store/useAuthStore";

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
  },
  withCredentials: true,
  timeout: 15000, // 15 seconds SLA
});

// Request interceptor: Inject Access Token & Tenant ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    const tenantId = localStorage.getItem(STORAGE_KEYS.TENANT_ID);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
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
    const originalRequest = error.config as any;

    // Check if the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
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
        // Request token renewal from authentication controller
        const response = await axios.post(`${envConfig.apiBaseUrl}/auth/refresh`, {}, {
          withCredentials: true
        });

        const { accessToken, newRefreshToken } = response.data;

        useAuthStore.setState({
          accessToken,
          refreshToken: newRefreshToken || useAuthStore.getState().refreshToken,
        });

        apiClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        clearAuthData();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      window.dispatchEvent(new Event("forbidden_redirect"));
    }

    return Promise.reject(error);
  }
);

const clearAuthData = () => {
  useAuthStore.getState().clearAuthData();
  // Optional custom redirection or event trigger
  window.dispatchEvent(new Event("unauthorized_redirect"));
};
