export interface ActiveScrutinResponseDto {
  success: true;
  message: string;
  data: {
    id: string;
    title: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    status: string;
    candidateLists: Array<{
      id: string;
      name: string;
      slogan: string | null;
      order: number;
    }>;
  };
}
