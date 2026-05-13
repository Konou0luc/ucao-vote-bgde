import type { Prisma } from "../../../generated/prisma/client";
import { OtpChallengeStatus, ScrutinStatus, StudentLevel } from "../../../generated/prisma/enums";
import type { OtpChallengeWithRelations, StudentWithRelations } from "../interfaces/otp.interfaces";
import { prisma } from "../../../infrastructure/prisma/client";

export class OtpRepository {
  upsertStudentShadow(input: {
    matricule: string;
    firstName: string;
    lastName: string;
    email?: string;
    department: string;
    level: StudentLevel;
    isEligible: boolean;
  }) {
    return prisma.student.upsert({
      where: { matricule: input.matricule },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        department: input.department,
        level: input.level,
        isEligible: input.isEligible,
      },
      create: {
        matricule: input.matricule,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        department: input.department,
        level: input.level,
        isEligible: input.isEligible,
      },
    });
  }

  findEligibleStudentByMatricule(matricule: string): Promise<StudentWithRelations | null> {
    return prisma.student.findUnique({
      where: { matricule },
      include: {
        participations: {
          select: { id: true, hasVoted: true, scrutinId: true },
        },
      },
    }) as Promise<StudentWithRelations | null>;
  }

  findActiveScrutin() {
    return prisma.scrutin.findFirst({
      where: {
        status: ScrutinStatus.OPEN,
      },
      orderBy: {
        startsAt: "asc",
      },
    });
  }

  countOtpSendsInWindow(studentId: string, scrutinId: string, windowStart: Date): Promise<number> {
    return prisma.otpChallenge.count({
      where: {
        studentId,
        scrutinId,
        createdAt: { gte: windowStart },
      },
    });
  }

  expirePendingChallenges(studentId: string, scrutinId: string): Promise<{ count: number }> {
    return prisma.otpChallenge.updateMany({
      where: {
        studentId,
        scrutinId,
        status: OtpChallengeStatus.PENDING,
      },
      data: {
        status: OtpChallengeStatus.EXPIRED,
      },
    });
  }

  createOtpChallenge(input: {
    studentId: string;
    scrutinId: string;
    email: string;
    otpHash: string;
    sessionToken: string;
    expiresAt: Date;
    maxAttempts: number;
  }) {
    return prisma.otpChallenge.create({
      data: {
        studentId: input.studentId,
        scrutinId: input.scrutinId,
        email: input.email,
        otpHash: input.otpHash,
        sessionToken: input.sessionToken,
        expiresAt: input.expiresAt,
        maxAttempts: input.maxAttempts,
      },
    });
  }

  findChallengeBySessionToken(sessionToken: string): Promise<OtpChallengeWithRelations | null> {
    return prisma.otpChallenge.findUnique({
      where: { sessionToken },
      include: {
        student: true,
        scrutin: true,
      },
    }) as Promise<OtpChallengeWithRelations | null>;
  }

  updateChallengeAttemptAndStatus(challengeId: string, attempts: number, status: OtpChallengeStatus) {
    return prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { attempts, status },
    });
  }

  markChallengeVerified(challengeId: string) {
    return prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        status: OtpChallengeStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });
  }

  upsertParticipation(studentId: string, scrutinId: string, participationRef: string) {
    return prisma.participation.upsert({
      where: {
        studentId_scrutinId: {
          studentId,
          scrutinId,
        },
      },
      update: {},
      create: {
        studentId,
        scrutinId,
        participationRef,
      },
    });
  }

  createAuditLog(input: {
    action: string;
    entity: string;
    entityId?: string;
    severity: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        severity: input.severity,
        metadata: input.metadata,
      },
    });
  }
}
