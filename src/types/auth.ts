import { USER_ROLE, KYC_STATUS } from "../constants";

export interface UserProfileDTO {
  id: string;
  username: string;
  email: string;
  roles: USER_ROLE[];
  permissions?: string[];
  kycStatus: KYC_STATUS;
  tenantId: string;
}

export interface LoginRequestDTO {
  username: string;
  password?: string; // Optionalized in DTO, handled safely in forms
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserProfileDTO;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken?: string;
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordRequestDTO {
  token: string;
  newPassword?: string;
}

export interface ChangePasswordRequestDTO {
  currentPassword?: string;
  newPassword?: string;
}

