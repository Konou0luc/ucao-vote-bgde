import { prisma } from "../../../infrastructure/prisma/client";
import { AdminRole, Prisma } from "../../../generated/prisma";

export class AdminManagementRepository {
  async findAll() {
    return prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        needsPasswordChange: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        needsPasswordChange: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: AdminRole;
    permissions: string[];
    needsPasswordChange?: boolean;
  }) {
    return prisma.admin.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        permissions: data.permissions as any,
        needsPasswordChange: data.needsPasswordChange ?? false,
      },
    });
  }

  async update(id: string, data: Partial<{
    email: string;
    passwordHash: string;
    role: AdminRole;
    permissions: string[];
    isActive: boolean;
    needsPasswordChange: boolean;
  }>) {
    return prisma.admin.update({
      where: { id },
      data: {
        ...data,
        permissions: data.permissions ? (data.permissions as any) : undefined,
      },
    });
  }

  async delete(id: string) {
    return prisma.admin.delete({ where: { id } });
  }
}
