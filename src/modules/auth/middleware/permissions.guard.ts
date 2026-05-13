import type { NextFunction, Request, Response } from "express";
import { AuthError } from "../errors/AuthError";
import type { AdminJwtPayload, AdminRole, AuthPermission } from "../interfaces/auth.types";

function getAdminPayload(req: Request): AdminJwtPayload | undefined {
  return (req as Request & { admin?: AdminJwtPayload }).admin;
}

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const admin = getAdminPayload(req);

    if (!admin) {
      next(new AuthError("Contexte admin manquant", 401));
      return;
    }

    if (!roles.includes(admin.role)) {
      next(new AuthError("Role insuffisant", 403));
      return;
    }

    next();
  };
}

export function requirePermissions(...permissions: AuthPermission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const admin = getAdminPayload(req);

    if (!admin) {
      next(new AuthError("Contexte admin manquant", 401));
      return;
    }

    const hasAllPermissions = permissions.every((permission) => admin.permissions.includes(permission));

    if (!hasAllPermissions) {
      next(new AuthError("Permissions insuffisantes", 403));
      return;
    }

    next();
  };
}
