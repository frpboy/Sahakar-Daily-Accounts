import { db } from "@/db";
import { TopNav } from "@/components/shared/TopNav";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/forms/UserForm";
import { deleteUser } from "@/lib/actions/users";
import { Users, Plus, Trash2, Mail, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  ho_accountant: "HO Accountant",
  outlet_manager: "Outlet Manager",
  outlet_accountant: "Outlet Accountant",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  ho_accountant: "bg-purple-100 text-purple-800",
  outlet_manager: "bg-blue-100 text-blue-800",
  outlet_accountant: "bg-green-100 text-green-800",
};

export default async function UsersPage() {
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

  return (
    <>
      <TopNav isAdmin={true} />
      <Container className="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">
              User Management
            </h1>
            <p className="text-gray-500">
              Manage users, roles, and branch assignments
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* User Form */}
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

          {/* Users List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Users ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No users found. Create your first user.
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900">
                                {user.name}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role ?? ""] || "bg-gray-100 text-gray-800"}`}
                              >
                                {ROLE_LABELS[user.role ?? ""] || user.role}
                              </span>
                              {user.isActive === "false" && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" />
                                  {user.phone}
                                </span>
                              )}
                              {user.outlet && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3.5 w-3.5" />
                                  {user.outlet.name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              Created{" "}
                              {user.createdAt
                                ? format(
                                    new Date(user.createdAt),
                                    "dd MMM yyyy"
                                  )
                                : "N/A"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <form
                              action={async () => {
                                "use server";
                                await deleteUser(user.id);
                                revalidatePath("/admin/users");
                              }}
                            >
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={user.role === "admin"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
