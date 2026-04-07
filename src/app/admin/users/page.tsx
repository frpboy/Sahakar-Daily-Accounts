import { db } from "@/db";
import { users as usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/forms/UserForm";
import { Plus } from "lucide-react";

import { RegistrationRequestsList } from "@/components/admin/RegistrationRequestsList";
import { UsersList } from "@/components/admin/UsersList";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const [caller] = await db
    .select({ role: usersTable.role, outletId: usersTable.outletId })
    .from(usersTable)
    .where(eq(usersTable.id, authUser.id))
    .limit(1);
  const callerRole = caller?.role ?? null;

  if (!callerRole || (callerRole !== "admin" && callerRole !== "ho_accountant" && callerRole !== "outlet_manager")) {
    redirect("/dashboard");
  }

  const isAdmin = callerRole === "admin";
  const isOutletManager = callerRole === "outlet_manager";
  const canCreateUsers = isAdmin || isOutletManager;

  const users = await (isOutletManager
    ? db.query.users.findMany({
        where: eq(usersTable.outletId, caller?.outletId ?? ""),
        with: { outlet: true },
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      })
    : db.query.users.findMany({
        with: { outlet: true },
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      }))
    .catch(() => []);

  const outlets = await (isOutletManager
    ? db.query.outlets.findMany({
        where: (outlets, { eq }) => eq(outlets.id, caller?.outletId ?? ""),
        orderBy: (outlets, { asc }) => [asc(outlets.name)],
      })
    : db.query.outlets.findMany({
        orderBy: (outlets, { asc }) => [asc(outlets.name)],
      }))
    .catch(() => []);

  const registrationRequests = await db.query.registrationRequests
    .findMany({
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    })
    .catch(() => []);

  return (
    <>
      <Container className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">
              User Management
            </h1>
            <p className="text-gray-500">
              {isAdmin
                ? "Manage users, roles, and branch assignments"
                : isOutletManager
                  ? "Manage outlet accountant users for your assigned outlet"
                  : "View all users"}
            </p>
          </div>
        </div>

        {/* Pending Requests Section — admin only */}
        {isAdmin && registrationRequests.some(r => r.status === "pending") && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Pending Registrations
            </h2>
            <RegistrationRequestsList
              requests={registrationRequests}
              outlets={outlets.map(o => ({ id: o.id, name: o.name }))}
            />
          </div>
        )}

        <div className={`grid gap-8 ${canCreateUsers ? "lg:grid-cols-3" : ""}`}>
          {/* Add User Form */}
          {canCreateUsers && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {isOutletManager ? "Add Outlet Accountant" : "Add New User"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserForm
                    outlets={outlets.map((o) => ({ id: o.id, name: o.name }))}
                    allowedRoles={
                      isOutletManager
                        ? ["outlet_accountant"]
                        : ["admin", "ho_accountant", "outlet_manager", "outlet_accountant"]
                    }
                    forcedOutletId={isOutletManager ? caller?.outletId ?? undefined : undefined}
                    lockRole={isOutletManager}
                    lockOutlet={isOutletManager}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users List */}
          <div className={canCreateUsers ? "lg:col-span-2" : ""}>
            <UsersList
              users={users}
              outlets={outlets.map((o) => ({ id: o.id, name: o.name }))}
              callerRole={callerRole}
              callerOutletId={caller?.outletId ?? null}
            />
          </div>
        </div>
      </Container>
    </>
  );
}
