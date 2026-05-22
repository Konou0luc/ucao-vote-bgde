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
      const files = req.files as any;
      console.log("DEBUG - Fichiers reçus (create):", {
        hasFiles: !!files,
        fields: files ? Object.keys(files) : [],
        video: files?.video?.[0] ? "PRESENT" : "ABSENT",
        image: files?.image?.[0] ? "PRESENT" : "ABSENT"
      });
      
      if (files?.video?.[0]) {
        const videoFile = files.video[0];
        req.body.videoUrl = videoFile.secure_url || videoFile.path;
        console.log("DEBUG - Video URL injectée:", req.body.videoUrl);
      }
      
      if (files?.image?.[0]) {
        const imageFile = files.image[0];
        req.body.imageUrl = imageFile.secure_url || imageFile.path;
        console.log("DEBUG - Image URL injectée:", req.body.imageUrl);
      }
      
      const payload = req.body as CreateCandidateListRequestDto;
      const item = await this.service.create(payload, getAdmin(req));
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
      const files = req.files as any;
      console.log("DEBUG - Fichiers reçus (update):", {
        hasFiles: !!files,
        fields: files ? Object.keys(files) : [],
        video: files?.video?.[0] ? "PRESENT" : "ABSENT",
        image: files?.image?.[0] ? "PRESENT" : "ABSENT"
      });
      
      if (files?.video?.[0]) {
        const videoFile = files.video[0];
        req.body.videoUrl = videoFile.secure_url || videoFile.path;
        console.log("DEBUG - Video URL injectée (update):", req.body.videoUrl);
      }
      
      if (files?.image?.[0]) {
        const imageFile = files.image[0];
        req.body.imageUrl = imageFile.secure_url || imageFile.path;
        console.log("DEBUG - Image URL injectée (update):", req.body.imageUrl);
      }
      
      const payload = req.body as UpdateCandidateListRequestDto;
      const item = await this.service.update(getParam(req.params.id), payload, getAdmin(req));
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
