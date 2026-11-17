import { env } from "../../config/env";
import { AppError } from "../../shared/errors/AppError";

export interface UniversityStudentVerifyResponse {
  exists: boolean;
  matricule: string;
  firstName?: string;
  lastName?: string;
  /** E-mail enregistré à l'inscription (lié au matricule) */
  email?: string;
  department?: string;
  level?: string;
  isActive?: boolean;
}

export interface UniversityRegistrationOptions {
  faculties: Array<{
    code: string;
    label: string;
    name: string;
    departments: Array<{ code: string; name: string }>;
  }>;
  levels: Array<{ name: string; rank: number }>;
}

export interface UniversityRegisterStudentInput {
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  facultyCode: string;
  departmentCode: string;
  levelName: "L1" | "L2" | "L3";
}

export interface UniversityRegisteredStudent {
  matricule: string;
  firstName: string;
  lastName: string;
  facultyCode: string;
  departmentCode: string;
  levelName: string;
  academicYear: string;
  registeredAt: string;
}

export class UniversityApiClient {
  /** Appel générique vers l'API universitaire ; relaie les erreurs métier (400/409/422). */
  private async request<T>(path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.UCAO_API_TIMEOUT_MS);

    try {
      const response = await fetch(`${env.UCAO_API_BASE_URL}${path}`, {
        method: init.method,
        headers: {
          "x-api-key": env.UCAO_API_KEY,
          "content-type": "application/json",
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as { message?: string; data?: T } | null;

      if (!response.ok) {
        if ([400, 409, 422].includes(response.status)) {
          throw new AppError(payload?.message ?? "Donnees invalides", response.status);
        }
        throw new AppError("Service universitaire indisponible", 503);
      }

      return payload?.data as T;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Impossible de joindre l'API universitaire", 503);
    } finally {
      clearTimeout(timeout);
    }
  }

  getRegistrationOptions(): Promise<UniversityRegistrationOptions> {
    return this.request<UniversityRegistrationOptions>("/api/students/registration-options", { method: "GET" });
  }

  /** Vérifie qu'une inscription est possible (doublons, filière, niveau) sans rien créer. */
  checkRegistration(input: UniversityRegisterStudentInput): Promise<{ available: true }> {
    return this.request<{ available: true }>("/api/students/registration-check", { method: "POST", body: input });
  }

  registerStudent(input: UniversityRegisterStudentInput): Promise<UniversityRegisteredStudent> {
    return this.request<UniversityRegisteredStudent>("/api/students/register", { method: "POST", body: input });
  }

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
