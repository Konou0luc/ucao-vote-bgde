import { Router } from "express";
import { validateParams } from "../../../shared/validators/validateParams";
import { ScrutinController } from "../controller/scrutin.controller";
import { ScrutinRepository } from "../repository/scrutin.repository";
import { ScrutinService } from "../service/scrutin.service";
import { scrutinIdParamSchema } from "../validator/scrutin.admin.validator";

const scrutinRepository = new ScrutinRepository();
const scrutinService = new ScrutinService(scrutinRepository);
const scrutinController = new ScrutinController(scrutinService);

export const scrutinRouter = Router();

scrutinRouter.get("/scrutin/active", (req, res, next) => scrutinController.getActiveScrutin(req, res, next));
scrutinRouter.get("/scrutin/:id/results", validateParams(scrutinIdParamSchema), (req, res, next) =>
  scrutinController.getPublishedResults(req, res, next),
);
