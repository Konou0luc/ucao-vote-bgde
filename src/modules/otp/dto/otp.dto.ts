export interface SendOtpRequestDto {
  matricule: string;
  email: string;
}

export interface SendOtpResponseDto {
  success: true;
  message: string;
  data: {
    sessionToken: string;
    expiresInMinutes: number;
    email: string;
    debugOtp?: string;
  };
}

export interface VerifyOtpRequestDto {
  sessionToken: string;
  otp: string;
}

export interface VerifyOtpResponseDto {
  success: true;
  message: string;
  data: {
    otpVerified: true;
    sessionToken: string;
    participationReady: true;
  };
}
