/**
 * AUCTBIZ - Enterprise Environment Configuration
 * This file handles configuration validation and exposes safe public variables.
 */

export interface EnvConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  env: "development" | "production" | "test";
  isDevelopment: boolean;
  isProduction: boolean;
}

const getEnvValue = (key: string, defaultValue: string): string => {
  return (import.meta as any).env[key] || defaultValue;
};

export const envConfig: EnvConfig = {
  apiBaseUrl: getEnvValue("VITE_API_BASE_URL", "/api"),
  wsBaseUrl: getEnvValue("VITE_WS_BASE_URL", `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`),
  env: (getEnvValue("VITE_APP_ENV", "development") as EnvConfig["env"]),
  get isDevelopment() {
    return this.env === "development";
  },
  get isProduction() {
    return this.env === "production";
  }
};
