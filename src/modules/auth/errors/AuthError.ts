import { AppError } from "../../../shared/errors/AppError";

export class AuthError extends AppError {
  constructor(message: string, statusCode = 401, details?: unknown[]) {
    super(message, statusCode, details);
    this.name = "AuthError";
  }
}
