export class HealthRepository {
  getUptime(): number {
    return process.uptime();
  }
}
