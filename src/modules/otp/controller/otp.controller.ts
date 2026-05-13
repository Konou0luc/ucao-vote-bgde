import type { NextFunction, Request, Response } from "express";
import type {
  SendOtpRequestDto,
  SendOtpResponseDto,
  VerifyOtpRequestDto,
  VerifyOtpResponseDto,
} from "../dto/otp.dto";
import { OtpService } from "../service/otp.service";

export class OtpController {
  constructor(private readonly service: OtpService) {}

  async sendOtp(
    req: Request<unknown, SendOtpResponseDto, SendOtpRequestDto>,
    res: Response<SendOtpResponseDto>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.service.sendOtp(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(
    req: Request<unknown, VerifyOtpResponseDto, VerifyOtpRequestDto>,
    res: Response<VerifyOtpResponseDto>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.service.verifyOtp(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
