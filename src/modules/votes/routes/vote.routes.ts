import { Router } from "express";
import { validateBody } from "../../../shared/validators/validateBody";
import { VoteController } from "../controller/vote.controller";
import { VoteRepository } from "../repository/vote.repository";
import { VoteService } from "../service/vote.service";
import { castVoteSchema } from "../validator/vote.validator";

const voteRepository = new VoteRepository();
const voteService = new VoteService(voteRepository);
const voteController = new VoteController(voteService);

export const voteRouter = Router();

voteRouter.post("/vote", validateBody(castVoteSchema), (req, res, next) =>
  voteController.castVote(req, res, next),
);
