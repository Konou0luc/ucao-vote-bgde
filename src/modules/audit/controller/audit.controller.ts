import { NextFunction, Request, Response } from "express";
import { AuditService } from "../service/audit.service";

export class AuditController {
  constructor(private readonly service: AuditService) {}

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await this.service.getLogs();
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}
