import { AuditRepository } from "../repository/audit.repository";

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async getLogs() {
    return this.repository.findAll();
  }

  async purgeLogs(beforeDate?: string) {
    if (beforeDate) {
      const date = new Date(beforeDate);
      if (isNaN(date.getTime())) {
        throw new Error("Date invalide");
      }
      return this.repository.deleteBefore(date);
    }
    return this.repository.deleteAll();
  }
}
