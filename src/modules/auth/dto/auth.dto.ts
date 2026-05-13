import type { AdminRole, AuthPermission } from "../interfaces/auth.types";

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface LogoutRequestDto {
  refreshToken: string;
}

export interface VerifyLoginOtpRequestDto {
  otpSessionToken: string;
  otp: string;
}

export interface AdminLoginPendingOtpResponseDto {
  success: true;
  message: string;
  data: {
    otpRequired: true;
    otpSessionToken: string;
    expiresInMinutes: number;
    emailMasked: string;
    debugOtp?: string;
  };
}

export interface AuthResponseDto {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    expiresIn: string;
    admin: {
      id: string;
      email: string;
      role: AdminRole;
      permissions: AuthPermission[];
    };
  };
}
