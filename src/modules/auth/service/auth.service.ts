import { OtpChallengeStatus } from "../../../generated/prisma";
import { env } from "../../../config/env";
import { mailer } from "../../../infrastructure/mail/mailer";
import { OTP_EXPIRES_IN_MINUTES, OTP_MAX_ATTEMPTS } from "../../../shared/constants/otp";
import {
  compareOtp,
  generateNumericOtp,
  generateSessionToken,
  hashOtp,
  maskEmail,
} from "../../../shared/utils/otp";
import type {
  AdminLoginPendingOtpResponseDto,
  AuthResponseDto,
  ChangePasswordRequestDto,
  LoginRequestDto,
  LogoutRequestDto,
  RefreshTokenRequestDto,
  VerifyLoginOtpRequestDto,
} from "../dto/auth.dto";
import { AuthError } from "../errors/AuthError";
import type { AdminRole, AuthPermission, AuthenticatedAdmin } from "../interfaces/auth.types";
import { AuthRepository } from "../repository/auth.repository";
import { hashPassword, verifyPassword } from "../utils/password.util";
import { TokenService } from "./token.service";

function getRolePermissions(role: AdminRole, dbPermissions?: any): AuthPermission[] {
  // If permissions are stored in DB and it's not a SUPER_ADMIN (who has everything anyway), use them
  if (Array.isArray(dbPermissions) && dbPermissions.length > 0 && role !== "SUPER_ADMIN") {
    return dbPermissions as AuthPermission[];
  }

  const commonPermissions: AuthPermission[] = [
    "scrutin:read",
    "candidate-list:read",
    "dashboard:read",
  ];

  if (role === "SUPER_ADMIN") {
    return [
      ...commonPermissions,
      "scrutin:write",
      "candidate-list:write",
      "results:publish",
      "audit:read",
    ];
  }

  return commonPermissions;
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async login(payload: LoginRequestDto): Promise<AdminLoginPendingOtpResponseDto> {
    const admin = await this.repository.findAdminByEmail(payload.email);

    if (!admin || !admin.isActive) {
      throw new AuthError("Identifiants invalides", 401);
    }

    const isPasswordValid = await verifyPassword(payload.password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError("Identifiants invalides", 401);
    }

    await this.repository.expirePendingAdminOtpChallenges(admin.id);

    const otp = generateNumericOtp();
    const otpHash = await hashOtp(otp);
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    await this.repository.createAdminOtpChallenge({
      adminId: admin.id,
      otpHash,
      sessionToken,
      expiresAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
    });

    await mailer.sendMail({
      from: `"VoteBGDE" <${env.MAIL_FROM}>`,
      to: admin.email,
      subject: "Code OTP - Connexion administration VoteBGDE",
      text: `Votre code de connexion est ${otp}. Il expire dans ${OTP_EXPIRES_IN_MINUTES} minutes. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.`,
    });

    await this.repository.createAuditLog({
      adminId: admin.id,
      action: "AUTH_ADMIN_OTP_SENT",
      entity: "Auth",
      entityId: admin.id,
      severity: "INFO",
    });

    return {
      success: true,
      message: "Code OTP envoye sur votre adresse email",
      data: {
        otpRequired: true,
        otpSessionToken: sessionToken,
        expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
        emailMasked: maskEmail(admin.email),
        ...(env.MAIL_TRANSPORT === "json" && env.NODE_ENV !== "production" ? { debugOtp: otp } : {}),
      },
    };
  }

  async verifyLoginOtp(payload: VerifyLoginOtpRequestDto): Promise<AuthResponseDto> {
    const challenge = await this.repository.findAdminOtpChallengeBySessionToken(payload.otpSessionToken.trim());

    if (!challenge) {
      throw new AuthError("Session OTP introuvable ou expiree", 404);
    }

    const admin = challenge.admin;
    if (!admin.isActive) {
      throw new AuthError("Compte administrateur inactif", 403);
    }

    if (challenge.status === OtpChallengeStatus.USED) {
      throw new AuthError("Ce code a deja ete utilise", 409);
    }
    if (challenge.status === OtpChallengeStatus.LOCKED) {
      throw new AuthError("Nombre maximal de tentatives depasse", 423);
    }
    if (challenge.status === OtpChallengeStatus.EXPIRED) {
      throw new AuthError("OTP expire. Demandez une nouvelle connexion depuis la page de login", 410);
    }
    if (challenge.status !== OtpChallengeStatus.PENDING) {
      throw new AuthError("Session OTP invalide", 401);
    }

    if (challenge.expiresAt < new Date()) {
      await this.repository.updateAdminOtpChallenge(challenge.id, {
        attempts: challenge.attempts,
        status: OtpChallengeStatus.EXPIRED,
      });
      throw new AuthError("OTP expire. Demandez une nouvelle connexion depuis la page de login", 410);
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      await this.repository.updateAdminOtpChallenge(challenge.id, {
        attempts: challenge.attempts,
        status: OtpChallengeStatus.LOCKED,
      });
      throw new AuthError("Nombre maximal de tentatives depasse", 423);
    }

    const isValidOtp = await compareOtp(payload.otp.trim(), challenge.otpHash);

    if (!isValidOtp) {
      const nextAttempts = challenge.attempts + 1;
      const nextStatus =
        nextAttempts >= challenge.maxAttempts ? OtpChallengeStatus.LOCKED : OtpChallengeStatus.PENDING;

      await this.repository.updateAdminOtpChallenge(challenge.id, {
        attempts: nextAttempts,
        status: nextStatus,
      });
      throw new AuthError("Code OTP invalide", 401, [
        { attemptsLeft: Math.max(challenge.maxAttempts - nextAttempts, 0) },
      ]);
    }

    await this.repository.updateAdminOtpChallenge(challenge.id, {
      attempts: challenge.attempts + 1,
      status: OtpChallengeStatus.USED,
    });

    const authAdmin: AuthenticatedAdmin = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: getRolePermissions(admin.role, admin.permissions),
    };

    const tokenPair = this.tokenService.createTokenPair(authAdmin);

    await this.repository.updateLastLogin(admin.id);
    await this.repository.createAuditLog({
      adminId: admin.id,
      action: "AUTH_LOGIN_SUCCESS",
      entity: "Auth",
      entityId: admin.id,
      severity: "INFO",
      metadata: { viaOtp: true },
    });

    return {
      success: true,
      message: "Connexion admin reussie",
      data: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: "Bearer",
        expiresIn: tokenPair.expiresIn,
        admin: {
          id: authAdmin.id,
          email: authAdmin.email,
          role: authAdmin.role,
          permissions: authAdmin.permissions,
          needsPasswordChange: (admin as any).needsPasswordChange,
        },
      },
    };
  }

  async refreshToken(payload: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    const decoded = this.tokenService.verifyRefreshToken(payload.refreshToken);
    const admin = await this.repository.findAdminById(decoded.sub);

    if (!admin || !admin.isActive) {
      throw new AuthError("Session invalide ou compte inactif", 401);
    }

    const authAdmin: AuthenticatedAdmin = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: getRolePermissions(admin.role, admin.permissions),
    };

    const tokenPair = this.tokenService.createTokenPair(authAdmin);

    return {
      success: true,
      message: "Token rafraichi",
      data: {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: "Bearer",
        expiresIn: tokenPair.expiresIn,
        admin: {
          id: authAdmin.id,
          email: authAdmin.email,
          role: authAdmin.role,
          permissions: authAdmin.permissions,
          needsPasswordChange: (admin as any).needsPasswordChange,
        },
      },
    };
  }

  async changePassword(adminId: string, payload: ChangePasswordRequestDto): Promise<void> {
    const admin = await this.repository.findAdminById(adminId);
    if (!admin) throw new AuthError("Admin introuvable", 404);

    const isPasswordValid = await verifyPassword(payload.currentPassword, admin.passwordHash);
    if (!isPasswordValid) throw new AuthError("Mot de passe actuel incorrect", 401);

    const newPasswordHash = await hashPassword(payload.newPassword);
    await this.repository.updateAdminPassword(adminId, newPasswordHash);

    await this.repository.createAuditLog({
      adminId,
      action: "AUTH_CHANGE_PASSWORD",
      entity: "Admin",
      entityId: adminId,
      severity: "INFO",
    });
  }

  async logout(payload: LogoutRequestDto): Promise<{ success: true; message: string; data: {} }> {
    // In a stateless JWT setup, logout is mainly handled by the client clearing the token.
    // However, we can track it in audit logs.
    try {
      const decoded = this.tokenService.verifyRefreshToken(payload.refreshToken);
      await this.repository.createAuditLog({
        adminId: decoded.sub,
        action: "AUTH_LOGOUT",
        entity: "Auth",
        entityId: decoded.sub,
        severity: "INFO",
      });
    } catch (error) {
      // Ignore errors during logout log
    }

    return {
      success: true,
      message: "Deconnexion reussie",
      data: {},
    };
  }
}
