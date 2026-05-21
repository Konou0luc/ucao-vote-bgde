import { Router } from "express";
import { requireAuth } from "../../auth/middleware/auth.guard";
import { requirePermissions } from "../../auth/middleware/permissions.guard";
import { validateBody } from "../../../shared/validators/validateBody";
import { validateParams } from "../../../shared/validators/validateParams";
import { uploadVideo } from "../../../shared/utils/cloudinary";
import { CandidateListController } from "../controller/candidate-list.controller";
import { CandidateListRepository } from "../repository/candidate-list.repository";
import { CandidateListService } from "../service/candidate-list.service";
import {
  candidateListIdParamSchema,
  createCandidateListSchema,
  scrutinIdParamSchema,
  updateCandidateListSchema,
} from "../validator/candidate-list.validator";

const repository = new CandidateListRepository();
const service = new CandidateListService(repository);
const controller = new CandidateListController(service);

export const candidateListAdminRouter = Router();

candidateListAdminRouter.use(requireAuth);

candidateListAdminRouter.post(
  "/admin/candidate-lists",
  requirePermissions("candidate-list:write"),
  uploadVideo.single("video"),
  validateBody(createCandidateListSchema),
  (req, res, next) => controller.create(req, res, next),
);
candidateListAdminRouter.get(
  "/admin/candidate-lists/scrutin/:scrutinId",
  requirePermissions("candidate-list:read"),
  validateParams(scrutinIdParamSchema),
  (req, res, next) => controller.listByScrutin(req, res, next),
);
candidateListAdminRouter.patch(
  "/admin/candidate-lists/:id",
  requirePermissions("candidate-list:write"),
  uploadVideo.single("video"),
  validateParams(candidateListIdParamSchema),
  validateBody(updateCandidateListSchema),
  (req, res, next) => controller.update(req, res, next),
);
candidateListAdminRouter.delete(
  "/admin/candidate-lists/:id",
  requirePermissions("candidate-list:write"),
  validateParams(candidateListIdParamSchema),
  (req, res, next) => controller.deactivate(req, res, next),
);
