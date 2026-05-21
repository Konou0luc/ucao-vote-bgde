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
      description: string | null;
      members: Array<{ name: string; role: string }>;
      actionPlan: string[];
      videoUrl: string | null;
      order: number;
    }>;
  };
}
