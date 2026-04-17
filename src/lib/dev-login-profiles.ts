import type { UserRole } from "@/db/schema";

export interface DevLoginProfile {
  key: string;
  label: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  outletAssignment: "none" | "first" | "second";
  outletLabel: string;
}

export const DEV_LOGIN_PROFILES: DevLoginProfile[] = [
  {
    key: "admin",
    label: "Admin",
    email: "dev.admin@sahakar.test",
    password: "Admin@12345",
    name: "Dev Admin",
    role: "admin",
    outletAssignment: "none",
    outletLabel: "All outlets",
  },
  {
    key: "ho-accountant",
    label: "HO Accountant",
    email: "dev.ho@sahakar.test",
    password: "HO@12345",
    name: "Dev HO Accountant",
    role: "ho_accountant",
    outletAssignment: "none",
    outletLabel: "All outlets",
  },
  {
    key: "outlet-manager",
    label: "Outlet Manager",
    email: "dev.manager@sahakar.test",
    password: "Manager@12345",
    name: "Dev Outlet Manager",
    role: "outlet_manager",
    outletAssignment: "first",
    outletLabel: "First outlet in DB",
  },
  {
    key: "outlet-accountant",
    label: "Outlet Accountant",
    email: "dev.accountant@sahakar.test",
    password: "Accountant@12345",
    name: "Dev Outlet Accountant",
    role: "outlet_accountant",
    outletAssignment: "second",
    outletLabel: "Second outlet in DB",
  },
];

export function getDevLoginProfile(key: string) {
  return DEV_LOGIN_PROFILES.find((profile) => profile.key === key) ?? null;
}

export function isDevLoginEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true"
  );
}
