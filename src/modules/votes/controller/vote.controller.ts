import type { NextFunction, Request, Response } from "express";
import type { CastVoteRequestDto, CastVoteResponseDto } from "../dto/vote.dto";
import { VoteService } from "../service/vote.service";

export class VoteController {
  constructor(private readonly service: VoteService) {}

  async castVote(
    req: Request<unknown, CastVoteResponseDto, CastVoteRequestDto>,
    res: Response<CastVoteResponseDto>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.service.castVote(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
