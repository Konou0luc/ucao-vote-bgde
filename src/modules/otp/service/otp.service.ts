import { OtpChallengeStatus, StudentLevel } from "../../../generated/prisma/enums";
import { UniversityApiClient } from "../../../infrastructure/http/university-api.client";
import { mailer } from "../../../infrastructure/mail/mailer";
import { env } from "../../../config/env";
import { AppError } from "../../../shared/errors/AppError";
import {
  OTP_EXPIRES_IN_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SEND_PER_WINDOW,
  OTP_SEND_WINDOW_MINUTES,
} from "../../../shared/constants/otp";
import {
  compareOtp,
  generateNumericOtp,
  generateParticipationRef,
  generateSessionToken,
  hashOtp,
  maskEmail,
} from "../../../shared/utils/otp";
import type {
  SendOtpRequestDto,
  SendOtpResponseDto,
  VerifyOtpRequestDto,
  VerifyOtpResponseDto,
} from "../dto/otp.dto";
import { OtpRepository } from "../repository/otp.repository";

export class OtpService {
  constructor(
    private readonly repository: OtpRepository,
    private readonly universityApiClient = new UniversityApiClient(),
  ) {}

  private mapUniversityLevel(level?: string): StudentLevel {
    const normalized = (level ?? "").trim().toUpperCase();
    if (["L1", "L2", "L3"].includes(normalized)) {
      return normalized as StudentLevel;
    }
    throw new AppError("Niveau universitaire non supporte pour le vote", 422);
  }

  async sendOtp(payload: SendOtpRequestDto): Promise<SendOtpResponseDto> {
    const verifyResult = await this.universityApiClient.verifyStudentByMatricule(payload.matricule);
    if (!verifyResult.exists || !verifyResult.isActive) {
      throw new AppError("Etudiant non trouve ou non autorise a voter", 404);
    }

    await this.repository.upsertStudentShadow({
      matricule: verifyResult.matricule,
      firstName: verifyResult.firstName ?? "Inconnu",
      lastName: verifyResult.lastName ?? "Inconnu",
      email: payload.email,
      department: verifyResult.department ?? "Non precise",
      level: this.mapUniversityLevel(verifyResult.level),
      isEligible: Boolean(verifyResult.isActive),
    });

    const student = await this.repository.findEligibleStudentByMatricule(payload.matricule);
    if (!student) {
      throw new AppError("Etudiant non trouve ou non autorise a voter", 404);
    }

    const activeScrutin = await this.repository.findActiveScrutin();
    if (!activeScrutin) {
      throw new AppError("Aucun scrutin actif pour le moment", 403);
    }

    const alreadyVoted = student.participations.some(
      (participation) => participation.scrutinId === activeScrutin.id && participation.hasVoted,
    );

    if (alreadyVoted) {
      throw new AppError("Cet etudiant a deja vote pour ce scrutin", 409);
    }

    const windowStart = new Date(Date.now() - OTP_SEND_WINDOW_MINUTES * 60 * 1000);
    const sendCount = await this.repository.countOtpSendsInWindow(student.id, activeScrutin.id, windowStart);

    if (sendCount >= OTP_MAX_SEND_PER_WINDOW) {
      throw new AppError("Trop de demandes OTP. Reessayez plus tard", 429);
    }

    await this.repository.expirePendingChallenges(student.id, activeScrutin.id);

    const otp = generateNumericOtp();
    const otpHash = await hashOtp(otp);
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    const challenge = await this.repository.createOtpChallenge({
      studentId: student.id,
      scrutinId: activeScrutin.id,
      email: payload.email,
      otpHash,
      sessionToken,
      expiresAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
    });

    await mailer.sendMail({
      from: env.MAIL_FROM,
      to: payload.email,
      subject: "Code OTP - Vote BGDE",
      text: `Votre code OTP est ${otp}. Il expire dans ${OTP_EXPIRES_IN_MINUTES} minutes.`,
    });

    await this.repository.createAuditLog({
      action: "OTP_SENT",
      entity: "OtpChallenge",
      entityId: challenge.id,
      severity: "INFO",
      metadata: {
        scrutinId: activeScrutin.id,
        studentId: student.id,
      },
    });

    return {
      success: true,
      message: "OTP envoye avec succes",
      data: {
        sessionToken,
        expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
        email: maskEmail(payload.email),
        ...(env.MAIL_TRANSPORT === "json" && env.NODE_ENV !== "production" ? { debugOtp: otp } : {}),
      },
    };
  }

  async verifyOtp(payload: VerifyOtpRequestDto): Promise<VerifyOtpResponseDto> {
    const challenge = await this.repository.findChallengeBySessionToken(payload.sessionToken);

    if (!challenge) {
      throw new AppError("Session OTP introuvable", 404);
    }

    if (challenge.status === OtpChallengeStatus.USED) {
      throw new AppError("OTP deja consomme", 409);
    }

    if (challenge.status === OtpChallengeStatus.VERIFIED) {
      return {
        success: true,
        message: "OTP deja verifie",
        data: {
          otpVerified: true,
          sessionToken: challenge.sessionToken,
          participationReady: true,
        },
      };
    }

    if (challenge.status === OtpChallengeStatus.EXPIRED || challenge.expiresAt < new Date()) {
      await this.repository.updateChallengeAttemptAndStatus(challenge.id, challenge.attempts, OtpChallengeStatus.EXPIRED);
      throw new AppError("OTP expire. Veuillez demander un nouveau code", 410);
    }

    if (challenge.attempts >= challenge.maxAttempts || challenge.status === OtpChallengeStatus.LOCKED) {
      await this.repository.updateChallengeAttemptAndStatus(challenge.id, challenge.attempts, OtpChallengeStatus.LOCKED);
      throw new AppError("Nombre maximal de tentatives depasse", 423);
    }

    const isValidOtp = await compareOtp(payload.otp, challenge.otpHash);

    if (!isValidOtp) {
      const nextAttempts = challenge.attempts + 1;
      const nextStatus = nextAttempts >= challenge.maxAttempts ? OtpChallengeStatus.LOCKED : OtpChallengeStatus.PENDING;

      await this.repository.updateChallengeAttemptAndStatus(challenge.id, nextAttempts, nextStatus);
      throw new AppError("OTP invalide", 401, [{ attemptsLeft: Math.max(challenge.maxAttempts - nextAttempts, 0) }]);
    }

    await this.repository.markChallengeVerified(challenge.id);
    await this.repository.upsertParticipation(
      challenge.studentId,
      challenge.scrutinId,
      generateParticipationRef(),
    );

    await this.repository.createAuditLog({
      action: "OTP_VERIFIED",
      entity: "OtpChallenge",
      entityId: challenge.id,
      severity: "INFO",
      metadata: {
        scrutinId: challenge.scrutinId,
        studentId: challenge.studentId,
      },
    });

    return {
      success: true,
      message: "OTP valide avec succes",
      data: {
        otpVerified: true,
        sessionToken: challenge.sessionToken,
        participationReady: true,
      },
    };
  }
}
