import { Router } from "express";
import { requireAuth } from "../../auth/middleware/auth.guard";
import { requirePermissions } from "../../auth/middleware/permissions.guard";
import { AuditController } from "../controller/audit.controller";
import { AuditRepository } from "../repository/audit.repository";
import { AuditService } from "../service/audit.service";

const repository = new AuditRepository();
const service = new AuditService(repository);
const controller = new AuditController(service);

export const auditRouter = Router();

auditRouter.get("/admin/audit-logs", requireAuth, requirePermissions("audit:read"), (req, res, next) =>
  controller.list(req, res, next)
);

auditRouter.delete("/admin/audit-logs", requireAuth, requirePermissions("audit:read"), (req, res, next) =>
  controller.purge(req, res, next)
);
