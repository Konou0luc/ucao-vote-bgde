export interface CastVoteRequestDto {
  sessionToken: string;
  candidateListId: string;
}

export interface CastVoteResponseDto {
  success: true;
  message: string;
  data: {
    voted: true;
    voteId: string;
    auditHash: string;
    castAt: string;
  };
}
