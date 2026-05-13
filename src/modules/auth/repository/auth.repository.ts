import type { Prisma } from "../../../generated/prisma/client";
import { OtpChallengeStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../../infrastructure/prisma/client";

export class AuthRepository {
  findAdminByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  }

  findAdminById(adminId: string) {
    return prisma.admin.findUnique({ where: { id: adminId } });
  }

  updateLastLogin(adminId: string) {
    return prisma.admin.update({
      where: { id: adminId },
      data: { lastLoginAt: new Date() },
    });
  }

  createAuditLog(input: {
    adminId?: string;
    action: string;
    entity: string;
    entityId?: string;
    severity: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.auditLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        severity: input.severity,
        metadata: input.metadata,
      },
    });
  }

  expirePendingAdminOtpChallenges(adminId: string) {
    return prisma.adminOtpChallenge.updateMany({
      where: { adminId, status: OtpChallengeStatus.PENDING },
      data: { status: OtpChallengeStatus.EXPIRED },
    });
  }

  createAdminOtpChallenge(input: {
    adminId: string;
    otpHash: string;
    sessionToken: string;
    expiresAt: Date;
    maxAttempts: number;
  }) {
    return prisma.adminOtpChallenge.create({
      data: {
        adminId: input.adminId,
        otpHash: input.otpHash,
        sessionToken: input.sessionToken,
        expiresAt: input.expiresAt,
        maxAttempts: input.maxAttempts,
      },
    });
  }

  findAdminOtpChallengeBySessionToken(sessionToken: string) {
    return prisma.adminOtpChallenge.findUnique({
      where: { sessionToken },
      include: { admin: true },
    });
  }

  updateAdminOtpChallenge(id: string, data: { attempts: number; status: OtpChallengeStatus }) {
    return prisma.adminOtpChallenge.update({
      where: { id },
      data: {
        attempts: data.attempts,
        status: data.status,
      },
    });
  }
}
