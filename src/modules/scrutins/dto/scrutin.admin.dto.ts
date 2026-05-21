export type ScrutinStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" | "ARCHIVED";

export interface CreateScrutinRequestDto {
  title: string;
  description?: string;
  bannerUrl?: string;
  targetDepartment?: string;
  targetLevel?: "L1" | "L2" | "L3";
  startsAt: string;
  endsAt: string;
  status?: ScrutinStatus;
}

export interface UpdateScrutinRequestDto {
  title?: string;
  description?: string;
  bannerUrl?: string;
  targetDepartment?: string;
  targetLevel?: "L1" | "L2" | "L3";
  startsAt?: string;
  endsAt?: string;
  status?: ScrutinStatus;
}

export interface ScrutinIdResponseDto {
  success: true;
  message: string;
  data: { id: string };
}
