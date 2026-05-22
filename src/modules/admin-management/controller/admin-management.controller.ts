import { NextFunction, Request, Response } from "express";
import { AdminManagementService } from "../service/admin-management.service";

export class AdminManagementController {
  constructor(private readonly service: AdminManagementService) {}

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const admins = await this.service.listAdmins();
      res.status(200).json({ success: true, data: admins });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = await this.service.createAdmin(req.body);
      res.status(201).json({ success: true, data: admin });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = await this.service.updateAdmin(req.params.id, req.body);
      res.status(200).json({ success: true, data: admin });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.service.deleteAdmin(req.params.id);
      res.status(200).json({ success: true, message: "Administrateur supprimé" });
    } catch (error) {
      next(error);
    }
  }
}
