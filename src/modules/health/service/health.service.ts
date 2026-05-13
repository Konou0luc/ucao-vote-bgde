import type { HealthDataDto } from "../dto/health.dto";
import { HealthRepository } from "../repository/health.repository";

export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  getStatus(): HealthDataDto {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: this.repository.getUptime(),
    };
  }
}
