import { prisma } from "../../../infrastructure/prisma/client";

export class CandidateListRepository {
  async findScrutinById(scrutinId: string) {
    return prisma.scrutin.findUnique({ where: { id: scrutinId } });
  }

  async findByNameAndScrutin(name: string, scrutinId: string) {
    return prisma.candidateList.findUnique({
      where: {
        scrutinId_name: {
          scrutinId,
          name,
        },
      },
    });
  }

  async create(data: any) {
    return prisma.candidateList.create({
      data: {
        ...data,
        members: data.members as any,
        actionPlan: data.actionPlan as any,
      },
    });
  }

  async listByScrutin(scrutinId: string) {
    return prisma.candidateList.findMany({
      where: { scrutinId },
      orderBy: { order: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.candidateList.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return prisma.candidateList.update({
      where: { id },
      data: {
        ...data,
        members: data.members ? (data.members as any) : undefined,
        actionPlan: data.actionPlan ? (data.actionPlan as any) : undefined,
      },
    });
  }

  async createAuditLog(input: {
    adminId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
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
