import { Router } from "express";
import { HealthController } from "../controller/health.controller";
import { HealthRepository } from "../repository/health.repository";
import { HealthService } from "../service/health.service";

const healthRepository = new HealthRepository();
const healthService = new HealthService(healthRepository);
const healthController = new HealthController(healthService);

export const healthRouter = Router();

healthRouter.get("/health", (req, res) => healthController.getHealth(req, res));
