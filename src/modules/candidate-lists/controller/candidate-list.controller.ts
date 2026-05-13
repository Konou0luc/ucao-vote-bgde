import type { NextFunction, Request, Response } from "express";
import type { AdminJwtPayload } from "../../auth/interfaces/auth.types";
import type { CreateCandidateListRequestDto, UpdateCandidateListRequestDto } from "../dto/candidate-list.dto";
import { CandidateListService } from "../service/candidate-list.service";

function getAdmin(req: Request): AdminJwtPayload {
  return (req as Request & { admin: AdminJwtPayload }).admin;
}

function getParam(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] : (param ?? "");
}

export class CandidateListController {
  constructor(private readonly service: CandidateListService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await this.service.create(req.body as CreateCandidateListRequestDto, getAdmin(req));
      res.status(201).json({ success: true, message: "Liste candidate creee", data: item });
    } catch (error) {
      next(error);
    }
  }

  async listByScrutin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await this.service.listByScrutin(getParam(req.params.scrutinId));
      res.status(200).json({ success: true, message: "Listes candidates", data: items });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await this.service.update(getParam(req.params.id), req.body as UpdateCandidateListRequestDto, getAdmin(req));
      res.status(200).json({ success: true, message: "Liste candidate mise a jour", data: item });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await this.service.deactivate(getParam(req.params.id), getAdmin(req));
      res.status(200).json({ success: true, message: "Liste candidate desactivee", data: item });
    } catch (error) {
      next(error);
    }
  }
}
