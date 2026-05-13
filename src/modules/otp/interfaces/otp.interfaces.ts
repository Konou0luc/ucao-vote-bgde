import type { OtpChallenge, Participation, Scrutin, Student } from "../../../generated/prisma/client";

export interface ActiveScrutinWithRelations extends Scrutin {
  participations: Pick<Participation, "id" | "hasVoted">[];
}

export interface StudentWithRelations extends Student {
  participations: Pick<Participation, "id" | "hasVoted" | "scrutinId">[];
}

export type OtpChallengeWithRelations = OtpChallenge & {
  student: Student;
  scrutin: Scrutin;
};
