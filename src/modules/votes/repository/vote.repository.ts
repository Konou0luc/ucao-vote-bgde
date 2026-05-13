import crypto from "crypto";
import type { Prisma } from "../../../generated/prisma/client";
import { OtpChallengeStatus, ScrutinStatus } from "../../../generated/prisma/enums";
import { env } from "../../../config/env";
import { prisma } from "../../../infrastructure/prisma/client";
import type { CandidateListForVote, VoteSessionContext } from "../interfaces/vote.interfaces";

export class VoteRepository {
  findVerifiedSession(sessionToken: string): Promise<VoteSessionContext | null> {
    return prisma.otpChallenge.findUnique({
      where: { sessionToken },
      include: {
        scrutin: true,
        student: {
          select: {
            id: true,
            participations: true,
          },
        },
      },
    }) as Promise<VoteSessionContext | null>;
  }

  findCandidateList(candidateListId: string): Promise<CandidateListForVote | null> {
    return prisma.candidateList.findUnique({
      where: { id: candidateListId },
    });
  }

  async castVoteTransaction(input: {
    sessionToken: string;
    scrutinId: string;
    studentId: string;
    candidateListId: string;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const challenge = await tx.otpChallenge.findUnique({
        where: { sessionToken: input.sessionToken },
      });

      if (!challenge || challenge.status !== OtpChallengeStatus.VERIFIED) {
        throw new Error("SESSION_NOT_VERIFIED");
      }

      const participation = await tx.participation.findUnique({
        where: {
          studentId_scrutinId: {
            studentId: input.studentId,
            scrutinId: input.scrutinId,
          },
        },
      });

      if (!participation) {
        throw new Error("PARTICIPATION_NOT_READY");
      }

      if (participation.hasVoted) {
        throw new Error("ALREADY_VOTED");
      }

      const auditHash = crypto
        .createHash("sha256")
        .update(`${participation.participationRef}:${input.candidateListId}:${Date.now()}:${env.JWT_SECRET}`)
        .digest("hex");

      const vote = await tx.vote.create({
        data: {
          scrutinId: input.scrutinId,
          candidateListId: input.candidateListId,
          participationRef: participation.participationRef,
          auditHash,
        },
      });

      await tx.participation.update({
        where: { id: participation.id },
        data: {
          hasVoted: true,
          votedAt: new Date(),
        },
      });

      await tx.otpChallenge.update({
        where: { id: challenge.id },
        data: {
          status: OtpChallengeStatus.USED,
          consumedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: "VOTE_CAST",
          entity: "Vote",
          entityId: vote.id,
          severity: "INFO",
          metadata: {
            scrutinId: input.scrutinId,
          },
        },
      });

      return vote;
    });
  }

  isScrutinOpen(status: string): boolean {
    return status === ScrutinStatus.OPEN;
  }
}
