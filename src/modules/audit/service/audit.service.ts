import { AuditRepository } from "../repository/audit.repository";

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async getLogs() {
    return this.repository.findAll();
  }
}
