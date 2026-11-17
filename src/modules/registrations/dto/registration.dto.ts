import type {
  UniversityRegisteredStudent,
  UniversityRegisterStudentInput,
  UniversityRegistrationOptions,
} from "../../../infrastructure/http/university-api.client";

export type RegisterStudentRequestDto = UniversityRegisterStudentInput;

export interface RegistrationOptionsDto extends UniversityRegistrationOptions {
  /** Inscriptions ouvertes uniquement lorsqu'aucun vote n'est en cours. */
  isOpen: boolean;
}

export type RegisteredStudentDto = UniversityRegisteredStudent;

export interface RegistrationStartResponseDto {
  sessionToken: string;
  expiresInMinutes: number;
  emailMasked: string;
  /** Uniquement en développement avec MAIL_TRANSPORT=json */
  debugOtp?: string;
}

export interface VerifyRegistrationRequestDto {
  sessionToken: string;
  otp: string;
}
