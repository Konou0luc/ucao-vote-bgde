import type { NextFunction, Request, Response } from "express";
import type { ActiveScrutinResponseDto } from "../dto/scrutin.dto";
import { ScrutinService } from "../service/scrutin.service";

function getParam(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] : (param ?? "");
}

export class ScrutinController {
  constructor(private readonly service: ScrutinService) {}

  async getActiveScrutin(
    _req: Request,
    res: Response<ActiveScrutinResponseDto>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.service.getActiveScrutin();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPublishedResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.service.getPublishedResults(getParam(req.params.id));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
