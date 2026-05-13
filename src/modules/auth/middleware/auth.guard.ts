import type { NextFunction, Request, Response } from "express";
import type { AdminJwtPayload } from "../interfaces/auth.types";
import { AuthError } from "../errors/AuthError";
import { TokenService } from "../service/token.service";

const tokenService = new TokenService();

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AuthError("Token d'authentification manquant", 401));
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = tokenService.verifyAccessToken(token);
    (req as Request & { admin?: AdminJwtPayload }).admin = payload;
    next();
  } catch {
    next(new AuthError("Token invalide ou expire", 401));
  }
}
