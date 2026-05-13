import { ScrutinStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../../shared/errors/AppError";
import type { ActiveScrutinResponseDto } from "../dto/scrutin.dto";
import { ScrutinRepository } from "../repository/scrutin.repository";

export class ScrutinService {
  constructor(private readonly repository: ScrutinRepository) {}

  async getActiveScrutin(): Promise<ActiveScrutinResponseDto> {
    const scrutin = await this.repository.findActiveScrutin();

    if (!scrutin) {
      throw new AppError("Aucun scrutin actif", 404);
    }

    return {
      success: true,
      message: "Scrutin actif recupere avec succes",
      data: {
        id: scrutin.id,
        title: scrutin.title,
        description: scrutin.description,
        startsAt: scrutin.startsAt.toISOString(),
        endsAt: scrutin.endsAt.toISOString(),
        status: scrutin.status,
        candidateLists: scrutin.candidateLists,
      },
    };
  }

  async getPublishedResults(scrutinId: string) {
    const scrutin = await this.repository.findPublishedScrutinById(scrutinId);

    if (!scrutin) {
      throw new AppError("Scrutin introuvable", 404);
    }

    if ((scrutin.status !== ScrutinStatus.CLOSED && scrutin.status !== ScrutinStatus.ARCHIVED) || !scrutin.resultsPublishedAt) {
      throw new AppError("Les resultats ne sont pas encore publies", 403);
    }

    const groupedVotes = await this.repository.groupVotesByCandidateList(scrutinId);
    const voteByListId = new Map(groupedVotes.map((entry) => [entry.candidateListId, entry._count._all]));
    const totalVotes = groupedVotes.reduce((acc, entry) => acc + entry._count._all, 0);

    const results = scrutin.candidateLists.map((list) => {
      const votes = voteByListId.get(list.id) ?? 0;
      const percentage = totalVotes > 0 ? Number(((votes / totalVotes) * 100).toFixed(2)) : 0;
      return {
        candidateListId: list.id,
        name: list.name,
        order: list.order,
        votes,
        percentage,
      };
    });

    return {
      success: true,
      message: "Resultats publics recuperes avec succes",
      data: {
        scrutinId: scrutin.id,
        title: scrutin.title,
        status: scrutin.status,
        resultsPublishedAt: scrutin.resultsPublishedAt,
        totalVotes,
        results,
      },
    };
  }
}
