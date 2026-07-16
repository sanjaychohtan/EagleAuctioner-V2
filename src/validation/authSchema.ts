import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .nonempty("Username is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .nonempty("Password is required"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().nonempty("Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid enterprise email address")
    .nonempty("Email is required"),
});

export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().nonempty("Reset token is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(100, "New password cannot exceed 100 characters")
    .nonempty("New password is required"),
  confirmPassword: z.string().nonempty("Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().nonempty("Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(100, "New password cannot exceed 100 characters")
    .nonempty("New password is required"),
  confirmPassword: z.string().nonempty("Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>;

