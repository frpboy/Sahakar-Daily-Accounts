import { UserRole } from "@/db/schema";

export type Permission =
  | "view:dashboard"
  | "view:all_outlets"
  | "view:own_outlet"
  | "view:reports"
  | "view:own_reports"
  | "view:accounts"
  | "view:users"
  | "entry:create"
  | "entry:edit_own"
  | "entry:edit_all"
  | "reports:export"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "accounts:manage";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view:dashboard",
    "view:all_outlets",
    "view:own_outlet",
    "view:reports",
    "view:own_reports",
    "view:accounts",
    "view:users",
    "entry:create",
    "entry:edit_own",
    "entry:edit_all",
    "reports:export",
    "users:create",
    "users:edit",
    "users:delete",
    "accounts:manage",
  ],
  ho_accountant: [
    "view:dashboard",
    "view:all_outlets",
    "view:own_outlet",
    "view:reports",
    "view:own_reports",
    "view:accounts",
    "view:users",
    "entry:create",
    "entry:edit_all",
    "reports:export",
  ],
  outlet_manager: [
    "view:dashboard",
    "view:own_outlet",
    "view:own_reports",
    "view:accounts",
    "entry:create",
    "entry:edit_own",
    "reports:export",
  ],
  outlet_accountant: [
    "view:dashboard",
    "view:own_outlet",
    "view:own_reports",
    "view:accounts",
    "entry:create",
    "entry:edit_own",
    "reports:export",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessOutlet(
  role: UserRole,
  userOutletId: string | null,
  targetOutletId: string
): boolean {
  if (role === "admin" || role === "ho_accountant") {
    return true;
  }
  return userOutletId === targetOutletId;
}

export function canAccessAllOutlets(role: UserRole): boolean {
  return role === "admin" || role === "ho_accountant";
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  ho_accountant: "HO Accountant",
  outlet_manager: "Outlet Manager",
  outlet_accountant: "Outlet Accountant",
};

export const OUTLET_TYPE_LABELS: Record<string, string> = {
  pharmacy: "Hyper Pharmacy",
  clinic: "Smart Clinic",
};
