import { Router } from "express";
import { validateBody } from "../../../shared/validators/validateBody";
import { AuthController } from "../controller/auth.controller";
import { AuthRepository } from "../repository/auth.repository";
import { AuthService } from "../service/auth.service";
import { TokenService } from "../service/token.service";
import { loginSchema, logoutSchema, refreshTokenSchema, verifyLoginOtpSchema } from "../validator/auth.validator";

const authRepository = new AuthRepository();
const tokenService = new TokenService();
const authService = new AuthService(authRepository, tokenService);
const authController = new AuthController(authService);

export const authRouter = Router();

// New centralized auth routes
authRouter.post("/auth/login", validateBody(loginSchema), (req, res, next) => authController.login(req, res, next));
authRouter.post("/auth/login/verify", validateBody(verifyLoginOtpSchema), (req, res, next) =>
  authController.verifyLoginOtp(req, res, next),
);
authRouter.post("/auth/refresh", validateBody(refreshTokenSchema), (req, res, next) => authController.refresh(req, res, next));
authRouter.post("/auth/logout", validateBody(logoutSchema), (req, res, next) => authController.logout(req, res, next));

// Backward-compatible login route
authRouter.post("/admin/login", validateBody(loginSchema), (req, res, next) => authController.login(req, res, next));
