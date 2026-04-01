import { UserRole } from "@/db/schema";

export interface SessionContext {
  role: UserRole;
  outletId: string;
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Returns the current hardcoded session context.
 * In a real app, this would query the database/session cookie.
 * 
 * Available Roles: "admin", "ho_accountant", "outlet_manager", "outlet_accountant"
 */
export async function getSessionContext(): Promise<SessionContext> {
  // Current hardcoded identity
  // You can change the role here to test different dashboards:
  const role = "admin" as UserRole; 
  const outletId = "f67bfedb-5141-4b12-a388-72dca5cf532a";

  return { 
    role, 
    outletId,
    isAuthenticated: true,
    user: {
      id: "admin-rahul",
      name: "Rahul",
      email: "frpboy12@gmail.com",
    }
  };
}
