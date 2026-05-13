import { OtpChallengeStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../../shared/errors/AppError";
import type { CastVoteRequestDto, CastVoteResponseDto } from "../dto/vote.dto";
import { VoteRepository } from "../repository/vote.repository";

export class VoteService {
  constructor(private readonly repository: VoteRepository) {}

  async castVote(payload: CastVoteRequestDto): Promise<CastVoteResponseDto> {
    const session = await this.repository.findVerifiedSession(payload.sessionToken);

    if (!session) {
      throw new AppError("Session OTP introuvable", 404);
    }

    if (!this.repository.isScrutinOpen(session.scrutin.status)) {
      throw new AppError("Le scrutin n'est pas ouvert", 403);
    }

    if (session.expiresAt < new Date()) {
      throw new AppError("Session OTP expiree", 410);
    }

    if (session.status !== OtpChallengeStatus.VERIFIED) {
      throw new AppError("Session OTP non verifiee", 401);
    }

    const candidateList = await this.repository.findCandidateList(payload.candidateListId);
    if (!candidateList || !candidateList.isActive) {
      throw new AppError("Liste candidate introuvable", 404);
    }

    if (candidateList.scrutinId !== session.scrutinId) {
      throw new AppError("Liste candidate invalide pour ce scrutin", 400);
    }

    try {
      const vote = await this.repository.castVoteTransaction({
        sessionToken: payload.sessionToken,
        scrutinId: session.scrutinId,
        studentId: session.studentId,
        candidateListId: payload.candidateListId,
      });

      return {
        success: true,
        message: "Vote enregistre avec succes",
        data: {
          voted: true,
          voteId: vote.id,
          auditHash: vote.auditHash,
          castAt: vote.castAt.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_VOTED") {
        throw new AppError("Cet etudiant a deja vote", 409);
      }
      if (error instanceof Error && error.message === "SESSION_NOT_VERIFIED") {
        throw new AppError("Session OTP non verifiee", 401);
      }
      if (error instanceof Error && error.message === "PARTICIPATION_NOT_READY") {
        throw new AppError("Participation non preparee. Verifiez OTP d'abord", 400);
      }
      throw error;
    }
  }
}
