import { env } from "../../config/env";
import { AppError } from "../../shared/errors/AppError";

export interface UniversityStudentVerifyResponse {
  exists: boolean;
  matricule: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  level?: string;
  isActive?: boolean;
}

export class UniversityApiClient {
  async verifyStudentByMatricule(matricule: string): Promise<UniversityStudentVerifyResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.UCAO_API_TIMEOUT_MS);

    try {
      const response = await fetch(`${env.UCAO_API_BASE_URL}/api/students/verify/${encodeURIComponent(matricule)}`, {
        method: "GET",
        headers: {
          "x-api-key": env.UCAO_API_KEY,
          "content-type": "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { exists: false, matricule };
        }
        throw new AppError("Service universitaire indisponible", 503);
      }

      const payload = (await response.json()) as {
        success: boolean;
        data: UniversityStudentVerifyResponse;
      };

      return payload.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Impossible de verifier le matricule aupres de l'API universitaire", 503);
    } finally {
      clearTimeout(timeout);
    }
  }
}
