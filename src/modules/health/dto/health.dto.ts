export interface HealthDataDto {
  status: "ok";
  timestamp: string;
  uptime: number;
}

export interface HealthResponseDto {
  success: true;
  message: string;
  data: HealthDataDto;
}
