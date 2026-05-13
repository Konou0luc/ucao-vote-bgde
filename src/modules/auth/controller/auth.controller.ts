import type { NextFunction, Request, Response } from "express";
import type {
  AdminLoginPendingOtpResponseDto,
  AuthResponseDto,
  LoginRequestDto,
  LogoutRequestDto,
  RefreshTokenRequestDto,
  VerifyLoginOtpRequestDto,
} from "../dto/auth.dto";
import { AuthService } from "../service/auth.service";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  async login(
    req: Request<unknown, AdminLoginPendingOtpResponseDto, LoginRequestDto>,
    res: Response<AdminLoginPendingOtpResponseDto>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.service.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyLoginOtp(
    req: Request<unknown, AuthResponseDto, VerifyLoginOtpRequestDto>,
    res: Response<AuthResponseDto>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.service.verifyLoginOtp(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async refresh(
    req: Request<unknown, AuthResponseDto, RefreshTokenRequestDto>,
    res: Response<AuthResponseDto>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.service.refreshToken(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(
    req: Request<unknown, { success: true; message: string; data: {} }, LogoutRequestDto>,
    res: Response<{ success: true; message: string; data: {} }>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.service.logout(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
