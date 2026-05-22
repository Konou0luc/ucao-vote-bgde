import { Router } from "express";
import { requireAuth } from "../../auth/middleware/auth.guard";
import { requireRole } from "../../auth/middleware/permissions.guard";
import { AdminManagementController } from "../controller/admin-management.controller";
import { AdminManagementRepository } from "../repository/admin-management.repository";
import { AdminManagementService } from "../service/admin-management.service";

const repository = new AdminManagementRepository();
const service = new AdminManagementService(repository);
const controller = new AdminManagementController(service);

export const adminManagementRouter = Router();

adminManagementRouter.use(requireAuth);
adminManagementRouter.use(requireRole("SUPER_ADMIN"));

adminManagementRouter.get("/admin/users", (req, res, next) => controller.list(req, res, next));
adminManagementRouter.post("/admin/users", (req, res, next) => controller.create(req, res, next));
adminManagementRouter.patch("/admin/users/:id", (req, res, next) => controller.update(req, res, next));
adminManagementRouter.delete("/admin/users/:id", (req, res, next) => controller.delete(req, res, next));
