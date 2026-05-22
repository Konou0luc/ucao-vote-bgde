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

  async deleteAll() {
    return prisma.auditLog.deleteMany({});
  }

  async deleteBefore(date: Date) {
    return prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });
  }
}
