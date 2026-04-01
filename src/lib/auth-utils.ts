import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface SessionContext {
  userId: string;
  role: "admin" | "manager";
  outletId?: string | null;
  isAdmin: boolean;
  isManager: boolean;
}

/**
 * Get session context from server-side Neon Auth
 */
export async function getSessionContext(): Promise<SessionContext> {
  const result = await auth.getSession();
  
  if (!result || !result.data?.user) {
    throw new Error("Authentication required");
  }

  const { user } = result.data;

  // Fetch role and other metadata from our database
  const [dbUser] = await db.select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser) {
    throw new Error("User not found in database");
  }

  const role = dbUser.role as "admin" | "manager";

  return {
    userId: user.id,
    role: role,
    outletId: dbUser.outletId,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
  };
}

/**
 * Verify admin access
 * Use in server actions or API routes
 */
export async function requireAdmin() {
  const context = await getSessionContext();
  if (!context.isAdmin) {
    throw new Error("Admin access required");
  }
  return context;
}

/**
 * Verify manager access
 * Use in server actions or API routes
 */
export async function requireManager() {
  const context = await getSessionContext();
  if (!context.isManager) {
    throw new Error("Manager access required");
  }
  return context;
}

/**
 * Helper to extract user info from Neon Auth JWT (for server-side validation)
 * This would decode a JWT token passed from client
 */
export function extractUserFromToken(token: string) {
  // TODO: Implement JWT verification with Neon Auth
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }
  
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    )
    return payload
  } catch (error) {
    throw new Error("Failed to decode token");
  }
}

