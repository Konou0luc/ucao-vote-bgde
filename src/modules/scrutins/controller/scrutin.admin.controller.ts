import type { NextFunction, Request, Response } from "express";
import type { AdminJwtPayload } from "../../auth/interfaces/auth.types";
import type { CreateScrutinRequestDto, UpdateScrutinRequestDto } from "../dto/scrutin.admin.dto";
import { ScrutinAdminService } from "../service/scrutin.admin.service";

function getAdmin(req: Request): AdminJwtPayload {
  return (req as Request & { admin: AdminJwtPayload }).admin;
}

function getParam(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] : (param ?? "");
}

export class ScrutinAdminController {
  constructor(private readonly service: ScrutinAdminService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scrutin = await this.service.create(req.body as CreateScrutinRequestDto, getAdmin(req));
      res.status(201).json({ success: true, message: "Scrutin cree", data: scrutin });
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scrutins = await this.service.list();
      res.status(200).json({ success: true, message: "Liste des scrutins", data: scrutins });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scrutin = await this.service.update(getParam(req.params.id), req.body as UpdateScrutinRequestDto, getAdmin(req));
      res.status(200).json({ success: true, message: "Scrutin mis a jour", data: scrutin });
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scrutin = await this.service.archive(getParam(req.params.id), getAdmin(req));
      res.status(200).json({ success: true, message: "Scrutin archive", data: scrutin });
    } catch (error) {
      next(error);
    }
  }

  async publishResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scrutin = await this.service.publishResults(getParam(req.params.id), getAdmin(req));
      res.status(200).json({ success: true, message: "Resultats publies", data: scrutin });
    } catch (error) {
      next(error);
    }
  }

  async dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.getDashboard(getAdmin(req));
      res.status(200).json({ success: true, message: "Dashboard admin", data });
    } catch (error) {
      next(error);
    }
  }

  async participation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await this.service.getParticipationStats(getParam(req.params.id), getAdmin(req));
      res.status(200).json({ success: true, message: "Statistiques de participation", data: stats });
    } catch (error) {
      next(error);
    }
  }

  async results(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await this.service.getResults(getParam(req.params.id), getAdmin(req));
      res.status(200).json({ success: true, message: "Resultats du scrutin", data: results });
    } catch (error) {
      next(error);
    }
  }
}
