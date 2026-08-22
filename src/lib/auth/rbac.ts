import { Role } from "@/types";

export const ROLES: Record<Role, Role> = {
  ADMIN: "ADMIN",
  HR: "HR",
  EMPLOYEE: "EMPLOYEE",
};

// Role hierarchy level: higher number = more privilege
export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  HR: 2,
  EMPLOYEE: 1,
};

export type Permission =
  | "users:create"
  | "users:read:all"
  | "users:read:self"
  | "users:update:all"
  | "users:update:self"
  | "users:delete"
  | "attendance:checkin"
  | "attendance:read:all"
  | "attendance:read:self"
  | "attendance:update:all"
  | "leaves:apply"
  | "leaves:read:all"
  | "leaves:read:self"
  | "leaves:approve"
  | "leaves:reject"
  | "salary:read:all"
  | "salary:read:self"
  | "salary:manage"
  | "audit:read";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "users:create",
    "users:read:all",
    "users:read:self",
    "users:update:all",
    "users:update:self",
    "users:delete",
    "attendance:checkin",
    "attendance:read:all",
    "attendance:read:self",
    "attendance:update:all",
    "leaves:apply",
    "leaves:read:all",
    "leaves:read:self",
    "leaves:approve",
    "leaves:reject",
    "salary:read:all",
    "salary:read:self",
    "salary:manage",
    "audit:read",
  ],
  HR: [
    "users:create",
    "users:read:all",
    "users:read:self",
    "users:update:all",
    "users:update:self",
    "attendance:checkin",
    "attendance:read:all",
    "attendance:read:self",
    "attendance:update:all",
    "leaves:apply",
    "leaves:read:all",
    "leaves:read:self",
    "leaves:approve",
    "leaves:reject",
    "salary:read:all",
    "salary:read:self",
    "salary:manage",
  ],
  EMPLOYEE: [
    "users:read:self",
    "users:update:self",
    "attendance:checkin",
    "attendance:read:self",
    "leaves:apply",
    "leaves:read:self",
    "salary:read:self",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isAtLeastRole(userRole: Role, minimumRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
}

// Protected route map with required roles
export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/dashboard": ["ADMIN", "HR", "EMPLOYEE"],
  "/profile": ["ADMIN", "HR", "EMPLOYEE"],
  "/attendance": ["ADMIN", "HR", "EMPLOYEE"],
  "/leaves": ["ADMIN", "HR", "EMPLOYEE"],
  "/employees": ["ADMIN", "HR"],
  "/payroll": ["ADMIN", "HR", "EMPLOYEE"], // Employees see self, Admin/HR see all
  "/audit-logs": ["ADMIN"],
};
