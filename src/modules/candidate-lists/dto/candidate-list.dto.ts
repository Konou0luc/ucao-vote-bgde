export interface CandidateListMemberDto {
  name: string;
  role: string;
}

export interface CreateCandidateListRequestDto {
  scrutinId: string;
  name: string;
  slogan?: string;
  description?: string;
  members?: CandidateListMemberDto[];
  actionPlan?: string[];
  videoUrl?: string;
  imageUrl?: string;
  order: number;
}

export interface UpdateCandidateListRequestDto {
  name?: string;
  slogan?: string;
  description?: string;
  members?: CandidateListMemberDto[];
  actionPlan?: string[];
  videoUrl?: string;
  imageUrl?: string;
  order?: number;
  isActive?: boolean;
}
