import type { NextFunction, Request, Response } from "express";
import type { AdminJwtPayload } from "../../auth/interfaces/auth.types";
import type { CreateCandidateListRequestDto, UpdateCandidateListRequestDto } from "../dto/candidate-list.dto";
import { CandidateListService } from "../service/candidate-list.service";
import { uploadToCloudinary } from "../../../shared/utils/cloudinary";

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
      
      if (files?.video?.[0]) {
        console.log("Upload vidéo vers Cloudinary en cours...");
        req.body.videoUrl = await uploadToCloudinary(files.video[0]);
        console.log("Upload vidéo terminé:", req.body.videoUrl);
      }
      
      if (files?.image?.[0]) {
        console.log("Upload image vers Cloudinary en cours...");
        req.body.imageUrl = await uploadToCloudinary(files.image[0]);
        console.log("Upload image terminé:", req.body.imageUrl);
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
      
      if (files?.video?.[0]) {
        console.log("Update: Upload vidéo vers Cloudinary en cours...");
        req.body.videoUrl = await uploadToCloudinary(files.video[0]);
        console.log("Update: Upload vidéo terminé:", req.body.videoUrl);
      }
      
      if (files?.image?.[0]) {
        console.log("Update: Upload image vers Cloudinary en cours...");
        req.body.imageUrl = await uploadToCloudinary(files.image[0]);
        console.log("Update: Upload image terminé:", req.body.imageUrl);
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
