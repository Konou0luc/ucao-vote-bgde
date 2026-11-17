import type { NextFunction, Request, Response } from "express";
import type { RegisterStudentRequestDto, VerifyRegistrationRequestDto } from "../dto/registration.dto";
import { RegistrationService } from "../service/registration.service";

export class RegistrationController {
  constructor(private readonly service: RegistrationService) {}

  async options(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.getOptions();
      res.status(200).json({ success: true, message: "Options d'inscription", data });
    } catch (error) {
      next(error);
    }
  }

  async start(req: Request<unknown, unknown, RegisterStudentRequestDto>, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.start(req.body);
      res.status(200).json({ success: true, message: "Code de verification envoye", data });
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request<unknown, unknown, VerifyRegistrationRequestDto>, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.verify(req.body);
      res.status(201).json({ success: true, message: "Inscription enregistree", data });
    } catch (error) {
      next(error);
    }
  }
}
