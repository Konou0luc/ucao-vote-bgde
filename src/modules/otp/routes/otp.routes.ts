import { Router } from "express";
import { OtpController } from "../controller/otp.controller";
import { OtpRepository } from "../repository/otp.repository";
import { OtpService } from "../service/otp.service";
import { validateBody } from "../../../shared/validators/validateBody";
import { sendOtpSchema, verifyOtpSchema } from "../validator/otp.validator";

const otpRepository = new OtpRepository();
const otpService = new OtpService(otpRepository);
const otpController = new OtpController(otpService);

export const otpRouter = Router();

otpRouter.post("/otp/send", validateBody(sendOtpSchema), (req, res, next) =>
  otpController.sendOtp(req, res, next),
);
otpRouter.post("/otp/verify", validateBody(verifyOtpSchema), (req, res, next) =>
  otpController.verifyOtp(req, res, next),
);
