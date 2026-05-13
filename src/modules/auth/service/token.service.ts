import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import type { AdminJwtPayload, AuthenticatedAdmin, RefreshJwtPayload } from "../interfaces/auth.types";
import { AuthError } from "../errors/AuthError";

class RefreshTokenStore {
  private revokedRefreshTokenIds = new Set<string>();

  revoke(jti: string): void {
    this.revokedRefreshTokenIds.add(jti);
  }

  isRevoked(jti: string): boolean {
    return this.revokedRefreshTokenIds.has(jti);
  }
}

const refreshTokenStore = new RefreshTokenStore();

export class TokenService {
  createTokenPair(admin: AuthenticatedAdmin): { accessToken: string; refreshToken: string; expiresIn: string } {
    const accessTokenExpiresIn = env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"];
    const refreshTokenExpiresIn = env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"];

    const accessPayload: AdminJwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      tokenType: "access",
    };

    const refreshPayload: RefreshJwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      tokenType: "refresh",
      jti: crypto.randomUUID(),
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = jwt.sign(refreshPayload, env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: refreshTokenExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    };
  }

  verifyAccessToken(token: string): AdminJwtPayload {
    const payload = jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;

    if (payload.tokenType !== "access") {
      throw new AuthError("Type de token invalide", 401);
    }

    return payload;
  }

  verifyRefreshToken(token: string): RefreshJwtPayload {
    const payload = jwt.verify(token, env.JWT_SECRET) as RefreshJwtPayload;

    if (payload.tokenType !== "refresh") {
      throw new AuthError("Type de token invalide", 401);
    }

    if (refreshTokenStore.isRevoked(payload.jti)) {
      throw new AuthError("Refresh token revoque", 401);
    }

    return payload;
  }

  revokeRefreshToken(token: string): void {
    const payload = jwt.verify(token, env.JWT_SECRET) as RefreshJwtPayload;
    if (payload.tokenType === "refresh") {
      refreshTokenStore.revoke(payload.jti);
    }
  }
}
