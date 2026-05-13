import { ScrutinStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../../infrastructure/prisma/client";

export class ScrutinRepository {
  findActiveScrutin() {
    return prisma.scrutin.findFirst({
      where: { status: ScrutinStatus.OPEN },
      include: {
        candidateLists: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            slogan: true,
            order: true,
          },
        },
      },
      orderBy: { startsAt: "asc" },
    });
  }

  findPublishedScrutinById(id: string) {
    return prisma.scrutin.findUnique({
      where: { id },
      include: {
        candidateLists: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            order: true,
            isActive: true,
          },
        },
      },
    });
  }

  groupVotesByCandidateList(scrutinId: string) {
    return prisma.vote.groupBy({
      by: ["candidateListId"],
      where: { scrutinId },
      _count: { _all: true },
    });
  }
}
