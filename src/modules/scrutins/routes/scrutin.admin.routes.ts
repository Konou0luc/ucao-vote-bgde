import { Router } from "express";
import { requireAuth } from "../../auth/middleware/auth.guard";
import { requirePermissions } from "../../auth/middleware/permissions.guard";
import { validateBody } from "../../../shared/validators/validateBody";
import { validateParams } from "../../../shared/validators/validateParams";
import { ScrutinAdminController } from "../controller/scrutin.admin.controller";
import { ScrutinAdminRepository } from "../repository/scrutin.admin.repository";
import { ScrutinAdminService } from "../service/scrutin.admin.service";
import { createScrutinSchema, scrutinIdParamSchema, updateScrutinSchema } from "../validator/scrutin.admin.validator";

const repository = new ScrutinAdminRepository();
const service = new ScrutinAdminService(repository);
const controller = new ScrutinAdminController(service);

export const scrutinAdminRouter = Router();

scrutinAdminRouter.use(requireAuth);

scrutinAdminRouter.get("/admin/dashboard", requirePermissions("dashboard:read"), (req, res, next) =>
  controller.dashboard(req, res, next),
);

scrutinAdminRouter.post(
  "/admin/scrutins",
  requirePermissions("scrutin:write"),
  validateBody(createScrutinSchema),
  (req, res, next) => controller.create(req, res, next),
);
scrutinAdminRouter.get("/admin/scrutins", requirePermissions("scrutin:read"), (req, res, next) =>
  controller.list(req, res, next),
);
scrutinAdminRouter.patch(
  "/admin/scrutins/:id",
  requirePermissions("scrutin:write"),
  validateParams(scrutinIdParamSchema),
  validateBody(updateScrutinSchema),
  (req, res, next) => controller.update(req, res, next),
);
scrutinAdminRouter.delete(
  "/admin/scrutins/:id",
  requirePermissions("scrutin:write"),
  validateParams(scrutinIdParamSchema),
  (req, res, next) => controller.archive(req, res, next),
);
scrutinAdminRouter.post(
  "/admin/scrutins/:id/publish-results",
  requirePermissions("results:publish"),
  validateParams(scrutinIdParamSchema),
  (req, res, next) => controller.publishResults(req, res, next),
);
scrutinAdminRouter.get(
  "/admin/scrutins/:id/participation",
  requirePermissions("scrutin:read"),
  validateParams(scrutinIdParamSchema),
  (req, res, next) => controller.participation(req, res, next),
);
scrutinAdminRouter.get(
  "/admin/scrutins/:id/results",
  requirePermissions("scrutin:read"),
  validateParams(scrutinIdParamSchema),
  (req, res, next) => controller.results(req, res, next),
);
