import type { NextFunction, Request, Response } from "express";
import type { ZodError, ZodType } from "zod";

export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as Request["params"];
      next();
    } catch (error) {
      next(error as ZodError);
    }
  };
}
