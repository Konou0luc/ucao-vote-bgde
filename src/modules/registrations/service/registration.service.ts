import { OtpChallengeStatus, ScrutinStatus, type Prisma } from "../../../generated/prisma";
import { prisma } from "../../../infrastructure/prisma/client";
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
import { compareOtp, generateNumericOtp, generateSessionToken, hashOtp, maskEmail } from "../../../shared/utils/otp";
import type {
  RegisteredStudentDto,
  RegisterStudentRequestDto,
  RegistrationOptionsDto,
  RegistrationStartResponseDto,
  VerifyRegistrationRequestDto,
} from "../dto/registration.dto";

/**
 * Inscription en deux étapes :
 *  1. start  : contrôle des données auprès de l'API universitaire, puis envoi d'un code à l'e-mail saisi ;
 *  2. verify : vérification du code, puis création de l'étudiant dans la base universitaire.
 * L'e-mail ainsi vérifié est lié au matricule et sera exigé au moment du vote.
 */
export class RegistrationService {
  constructor(private readonly universityApiClient = new UniversityApiClient()) {}

  private async isVoteOpen(): Promise<boolean> {
    const open = await prisma.scrutin.findFirst({ where: { status: ScrutinStatus.OPEN }, select: { id: true } });
    return Boolean(open);
  }

  private async assertRegistrationOpen(): Promise<void> {
    if (await this.isVoteOpen()) {
      throw new AppError("Les inscriptions sont fermees pendant le vote", 403);
    }
  }

  async getOptions(): Promise<RegistrationOptionsDto> {
    const [voteOpen, options] = await Promise.all([this.isVoteOpen(), this.universityApiClient.getRegistrationOptions()]);
    return { ...options, isOpen: !voteOpen };
  }

  async start(payload: RegisterStudentRequestDto): Promise<RegistrationStartResponseDto> {
    await this.assertRegistrationOpen();

    // Refuse d'emblée un matricule / e-mail déjà inscrit ou une filière invalide (aucun code envoyé inutilement).
    await this.universityApiClient.checkRegistration(payload);

    const windowStart = new Date(Date.now() - OTP_SEND_WINDOW_MINUTES * 60 * 1000);
    const recentSends = await prisma.registrationChallenge.count({
      where: {
        createdAt: { gte: windowStart },
        OR: [{ matricule: payload.matricule }, { email: payload.email }],
      },
    });
    if (recentSends >= OTP_MAX_SEND_PER_WINDOW) {
      throw new AppError("Trop de demandes de code. Reessayez plus tard", 429);
    }

    // Un seul code valide à la fois pour un matricule.
    await prisma.registrationChallenge.updateMany({
      where: { matricule: payload.matricule, status: OtpChallengeStatus.PENDING },
      data: { status: OtpChallengeStatus.EXPIRED },
    });

    const otp = generateNumericOtp();
    const sessionToken = generateSessionToken();
    const challenge = await prisma.registrationChallenge.create({
      data: {
        matricule: payload.matricule,
        email: payload.email,
        payload: payload as unknown as Prisma.InputJsonValue,
        otpHash: await hashOtp(otp),
        sessionToken,
        maxAttempts: OTP_MAX_ATTEMPTS,
        expiresAt: new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000),
      },
    });

    await mailer.sendMail({
      from: `"VoteBGDE" <${env.MAIL_FROM}>`,
      to: payload.email,
      subject: "Code de verification - Inscription VoteBGDE",
      text:
        `Bonjour ${payload.firstName},\n\n` +
        `Votre code de verification pour l'inscription au vote BGDE est ${otp}.\n` +
        `Il expire dans ${OTP_EXPIRES_IN_MINUTES} minutes.\n\n` +
        `Si vous n'etes pas a l'origine de cette demande, ignorez ce message.`,
    });

    await prisma.auditLog.create({
      data: {
        action: "REGISTRATION_OTP_SENT",
        entity: "RegistrationChallenge",
        entityId: challenge.id,
        severity: "INFO",
        metadata: { matricule: payload.matricule },
      },
    });

    return {
      sessionToken,
      expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
      emailMasked: maskEmail(payload.email),
      ...(env.MAIL_TRANSPORT === "json" && env.NODE_ENV !== "production" ? { debugOtp: otp } : {}),
    };
  }

  async verify(input: VerifyRegistrationRequestDto): Promise<RegisteredStudentDto> {
    const challenge = await prisma.registrationChallenge.findUnique({ where: { sessionToken: input.sessionToken } });
    if (!challenge) {
      throw new AppError("Session d'inscription introuvable. Recommencez l'inscription", 404);
    }
    if (challenge.status === OtpChallengeStatus.USED) {
      throw new AppError("Cette inscription a deja ete validee", 409);
    }
    if (challenge.status === OtpChallengeStatus.EXPIRED || challenge.expiresAt < new Date()) {
      await prisma.registrationChallenge.update({ where: { id: challenge.id }, data: { status: OtpChallengeStatus.EXPIRED } });
      throw new AppError("Code expire. Demandez un nouveau code", 410);
    }
    if (challenge.status === OtpChallengeStatus.LOCKED || challenge.attempts >= challenge.maxAttempts) {
      await prisma.registrationChallenge.update({ where: { id: challenge.id }, data: { status: OtpChallengeStatus.LOCKED } });
      throw new AppError("Nombre maximal de tentatives depasse. Demandez un nouveau code", 423);
    }

    if (!(await compareOtp(input.otp, challenge.otpHash))) {
      const attempts = challenge.attempts + 1;
      await prisma.registrationChallenge.update({
        where: { id: challenge.id },
        data: { attempts, status: attempts >= challenge.maxAttempts ? OtpChallengeStatus.LOCKED : OtpChallengeStatus.PENDING },
      });
      throw new AppError("Code incorrect", 401, [{ attemptsLeft: Math.max(challenge.maxAttempts - attempts, 0) }]);
    }

    await this.assertRegistrationOpen();

    // Marque le code comme utilisé avant l'appel externe pour empêcher une double validation concurrente.
    const claimed = await prisma.registrationChallenge.updateMany({
      where: { id: challenge.id, status: OtpChallengeStatus.PENDING },
      data: { status: OtpChallengeStatus.USED, verifiedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new AppError("Cette inscription a deja ete validee", 409);
    }

    let registered: RegisteredStudentDto;
    try {
      registered = await this.universityApiClient.registerStudent(challenge.payload as unknown as RegisterStudentRequestDto);
    } catch (error) {
      // Échec technique : on rend le code de nouveau utilisable pour que l'étudiant puisse réessayer.
      if (error instanceof AppError && error.statusCode >= 500) {
        await prisma.registrationChallenge.update({
          where: { id: challenge.id },
          data: { status: OtpChallengeStatus.PENDING, verifiedAt: null },
        });
      }
      throw error;
    }

    await prisma.auditLog.create({
      data: {
        action: "STUDENT_REGISTERED",
        entity: "Student",
        entityId: registered.matricule,
        severity: "INFO",
        metadata: {
          emailVerified: true,
          facultyCode: registered.facultyCode,
          departmentCode: registered.departmentCode,
          levelName: registered.levelName,
          academicYear: registered.academicYear,
        },
      },
    });

    return registered;
  }
}
