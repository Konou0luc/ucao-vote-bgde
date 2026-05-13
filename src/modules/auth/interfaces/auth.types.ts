export type AdminRole = "SUPER_ADMIN" | "STANDARD_ADMIN";

export type AuthPermission =
  | "scrutin:read"
  | "scrutin:write"
  | "candidate-list:read"
  | "candidate-list:write"
  | "results:publish"
  | "dashboard:read"
  | "audit:read";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
  permissions: AuthPermission[];
  tokenType: "access";
}

export interface RefreshJwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
  tokenType: "refresh";
  jti: string;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: AdminRole;
  permissions: AuthPermission[];
}
