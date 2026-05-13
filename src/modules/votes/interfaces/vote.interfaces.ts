import type { CandidateList, OtpChallenge, Participation, Scrutin } from "../../../generated/prisma/client";

export type VoteSessionContext = OtpChallenge & {
  scrutin: Scrutin;
  student: {
    id: string;
    participations: Participation[];
  };
};

export type CandidateListForVote = CandidateList;
