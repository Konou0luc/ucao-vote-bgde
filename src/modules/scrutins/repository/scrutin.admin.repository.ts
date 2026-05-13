import type { Prisma } from "../../../generated/prisma/client";
import { ScrutinStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../../infrastructure/prisma/client";

export class ScrutinAdminRepository {
  create(data: Prisma.ScrutinCreateInput) {
    return prisma.scrutin.create({ data });
  }

  list() {
    return prisma.scrutin.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string) {
    return prisma.scrutin.findUnique({ where: { id } });
  }

  findOpenScrutin(excludeId?: string) {
    return prisma.scrutin.findFirst({
      where: {
        status: ScrutinStatus.OPEN,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: { startsAt: "asc" },
    });
  }

  update(id: string, data: Prisma.ScrutinUpdateInput) {
    return prisma.scrutin.update({ where: { id }, data });
  }

  archive(id: string) {
    return prisma.scrutin.update({
      where: { id },
      data: { status: ScrutinStatus.ARCHIVED },
    });
  }

  publishResults(id: string) {
    return prisma.scrutin.update({
      where: { id },
      data: { resultsPublishedAt: new Date() },
    });
  }

  countEligibleStudents() {
    return prisma.student.count({ where: { isEligible: true } });
  }

  countParticipations(scrutinId: string) {
    return prisma.participation.count({ where: { scrutinId } });
  }

  countVoters(scrutinId: string) {
    return prisma.participation.count({ where: { scrutinId, hasVoted: true } });
  }

  listCandidateLists(scrutinId: string) {
    return prisma.candidateList.findMany({
      where: { scrutinId },
      select: { id: true, name: true, order: true, isActive: true },
      orderBy: { order: "asc" },
    });
  }

  groupVotesByCandidateList(scrutinId: string) {
    return prisma.vote.groupBy({
      by: ["candidateListId"],
      where: { scrutinId },
      _count: { _all: true },
    });
  }

  /** Nombre total de votes enregistrés (tous scrutins). */
  countTotalVotes() {
    return prisma.vote.count();
  }

  countScrutinsByStatus(status: ScrutinStatus) {
    return prisma.scrutin.count({ where: { status } });
  }

  createAuditLog(input: {
    adminId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.auditLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        severity: "INFO",
        metadata: input.metadata,
      },
    });
  }
}
