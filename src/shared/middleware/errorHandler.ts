import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../../infrastructure/logger/logger";
import { AppError } from "../errors/AppError";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.details ?? [],
    });
    return;
  }

  logger.error({ err: error }, "Unhandled application error");

  res.status(500).json({
    success: false,
    message: "Internal server error",
    errors: [],
  });
}
