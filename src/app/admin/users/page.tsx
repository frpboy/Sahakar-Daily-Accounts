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

  const [caller] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, authUser.id)).limit(1);
  const callerRole = caller?.role ?? null;

  // Outlet-level roles have no access to user management at all
  if (!callerRole || (callerRole !== "admin" && callerRole !== "ho_accountant")) {
    redirect("/dashboard");
  }

  const isAdmin = callerRole === "admin";

  const users = await db.query.users
    .findMany({
      with: {
        outlet: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    })
    .catch(() => []);

  const outlets = await db.query.outlets
    .findMany({
      orderBy: (outlets, { asc }) => [asc(outlets.name)],
    })
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
              {isAdmin ? "Manage users, roles, and branch assignments" : "View all users"}
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

        <div className={`grid gap-8 ${isAdmin ? "lg:grid-cols-3" : ""}`}>
          {/* Add User Form — admin only */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserForm
                    outlets={outlets.map((o) => ({ id: o.id, name: o.name }))}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users List */}
          <div className={isAdmin ? "lg:col-span-2" : ""}>
            <UsersList
              users={users}
              outlets={outlets.map((o) => ({ id: o.id, name: o.name }))}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </Container>
    </>
  );
}
