import { db } from "@/db";

import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/forms/UserForm";
import { Plus } from "lucide-react";


import { RegistrationRequestsList } from "@/components/admin/RegistrationRequestsList";
import { UsersList } from "@/components/admin/UsersList";

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
              Manage users, roles, and branch assignments
            </p>
          </div>
        </div>

        {/* Pending Requests Section */}
        {registrationRequests.some(r => r.status === "pending") && (
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
            <UsersList
              users={users}
              outlets={outlets.map((o) => ({ id: o.id, name: o.name }))}
            />
          </div>
        </div>
      </Container>
    </>
  );
}
