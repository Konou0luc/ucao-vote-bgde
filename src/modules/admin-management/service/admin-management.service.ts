import { AdminManagementRepository } from "../repository/admin-management.repository";
import { hashPassword } from "../../auth/utils/password.util";
import { AppError } from "../../../shared/errors/AppError";

export class AdminManagementService {
  constructor(private readonly repository: AdminManagementRepository) {}

  async listAdmins() {
    return this.repository.findAll();
  }

  async createAdmin(data: any) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new AppError("Cet email est déjà utilisé", 409);
    }

    const passwordHash = await hashPassword(data.password);
    return this.repository.create({
      email: data.email,
      passwordHash,
      role: data.role,
      permissions: data.permissions || [],
    });
  }

  async updateAdmin(id: string, data: any) {
    if (data.password) {
      data.passwordHash = await hashPassword(data.password);
      delete data.password;
    }
    return this.repository.update(id, data);
  }

  async deleteAdmin(id: string) {
    return this.repository.delete(id);
  }
}
