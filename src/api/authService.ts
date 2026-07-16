import { apiClient } from "./client";
import { API_ENDPOINTS } from "../constants";
import {
  LoginRequestDTO,
  LoginResponseDTO,
  RefreshTokenRequestDTO,
  RefreshTokenResponseDTO,
  UserProfileDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordRequestDTO,
  ChangePasswordRequestDTO,
} from "../types/auth";

export const AuthService = {
  /**
   * Authorizes an operator and returns secure JWT access/refresh tokens.
   */
  async login(credentials: LoginRequestDTO): Promise<LoginResponseDTO> {
    // Audit log without password disclosure
    console.log(`[AuthService] Initiating login flow for identifier: ${credentials.username}`);
    
    const response = await apiClient.post<LoginResponseDTO>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    console.log(`[AuthService] Login response received for username: ${credentials.username}`);
    return response.data;
  },

  /**
   * Terminating active secure session on the backend.
   */
  async logout(): Promise<void> {
    console.log("[AuthService] Terminating active secure session on the backend");
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (err) {
      // Gracefully capture network or session termination issues
      console.warn("[AuthService] Remote logout failed or session already terminated", err);
    }
  },

  /**
   * Revokes a specific active session on the remote server by ID.
   */
  async revokeSession(sessionId: string): Promise<void> {
    console.log(`[AuthService] Revoking session with ID: ${sessionId} on the backend`);
    await apiClient.post(`/auth/sessions/${sessionId}/revoke`);
  },

  /**
   * Renews the session credentials using a persistent refresh token.
   */
  async refresh(request: RefreshTokenRequestDTO): Promise<RefreshTokenResponseDTO> {
    console.log("[AuthService] Dispatching refresh token request to renew active session");
    const response = await apiClient.post<RefreshTokenResponseDTO>(
      API_ENDPOINTS.AUTH.REFRESH,
      request
    );
    return response.data;
  },

  /**
   * Retrieves the current authenticated user's profile details.
   */
  async me(): Promise<UserProfileDTO> {
    console.log("[AuthService] Refreshing user context from the backend database");
    const response = await apiClient.get<UserProfileDTO>(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  /**
   * Triggers a forgot-password email dispatch on the backend.
   */
  async forgotPassword(request: ForgotPasswordRequestDTO): Promise<void> {
    console.log(`[AuthService] Dispatched password recovery sequence for email`);
    await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, request);
  },

  /**
   * Resets the operator password using an email verification token.
   */
  async resetPassword(request: ResetPasswordRequestDTO): Promise<void> {
    console.log("[AuthService] Submitting password reset payload with verification token");
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, request);
  },

  /**
   * Changes the password of the active logged-in operator.
   */
  async changePassword(request: ChangePasswordRequestDTO): Promise<void> {
    console.log("[AuthService] Dispatching change password query for current user");
    await apiClient.post("/auth/change-password", request);
  },
};
export default AuthService;
