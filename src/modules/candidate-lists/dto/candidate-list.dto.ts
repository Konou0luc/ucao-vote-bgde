export interface CreateCandidateListRequestDto {
  scrutinId: string;
  name: string;
  slogan?: string;
  description?: string;
  order: number;
}

export interface UpdateCandidateListRequestDto {
  name?: string;
  slogan?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}
