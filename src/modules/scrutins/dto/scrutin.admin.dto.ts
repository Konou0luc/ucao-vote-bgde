export interface CreateScrutinRequestDto {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  status?: "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" | "ARCHIVED";
}

export interface UpdateScrutinRequestDto {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  status?: "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" | "ARCHIVED";
}
