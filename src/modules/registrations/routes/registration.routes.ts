import { Router } from "express";
import { otpVerifyRateLimiter, registrationRateLimiter } from "../../../shared/middleware/security";
import { validateBody } from "../../../shared/validators/validateBody";
import { RegistrationController } from "../controller/registration.controller";
import { RegistrationService } from "../service/registration.service";
import { registerStudentSchema, verifyRegistrationSchema } from "../validator/registration.validator";

const controller = new RegistrationController(new RegistrationService());

export const registrationRouter = Router();

registrationRouter.get("/registration/options", (req, res, next) => controller.options(req, res, next));

// Étape 1 : contrôle des données + envoi du code à l'e-mail saisi.
registrationRouter.post("/registration/start", registrationRateLimiter, validateBody(registerStudentSchema), (req, res, next) =>
  controller.start(req, res, next),
);

// Étape 2 : vérification du code ; l'étudiant n'est créé qu'après cette étape.
registrationRouter.post("/registration/verify", otpVerifyRateLimiter, validateBody(verifyRegistrationSchema), (req, res, next) =>
  controller.verify(req, res, next),
);
