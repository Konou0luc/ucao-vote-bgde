import { prisma } from "../../../infrastructure/prisma/client";

export class AuditRepository {
  async findAll() {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      take: 500, // Limit to last 500 logs for performance
    });
  }
}
