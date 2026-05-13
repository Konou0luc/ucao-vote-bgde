import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../infrastructure/prisma/client";

export class CandidateListRepository {
  findScrutinById(scrutinId: string) {
    return prisma.scrutin.findUnique({ where: { id: scrutinId } });
  }

  create(data: Prisma.CandidateListCreateInput) {
    return prisma.candidateList.create({ data });
  }

  listByScrutin(scrutinId: string) {
    return prisma.candidateList.findMany({
      where: { scrutinId },
      orderBy: { order: "asc" },
    });
  }

  findById(id: string) {
    return prisma.candidateList.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.CandidateListUpdateInput) {
    return prisma.candidateList.update({ where: { id }, data });
  }

  deactivate(id: string) {
    return prisma.candidateList.update({
      where: { id },
      data: { isActive: false },
    });
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
