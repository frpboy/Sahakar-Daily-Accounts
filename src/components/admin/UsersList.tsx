"use client";

import { useState } from "react";
import { Mail, Building2, Trash2, Pencil, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { UserForm } from "@/components/forms/UserForm";
import { deleteUser } from "@/lib/actions/users";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  outletId: string | null;
  isActive: string | null;
  createdAt: Date | null;
  outlet: { id: string; name: string } | null;
}

interface UsersListProps {
  users: User[];
  outlets: Array<{ id: string; name: string }>;
  callerRole: "admin" | "ho_accountant" | "outlet_manager";
  callerOutletId?: string | null;
}

export function UsersList({ users, outlets, callerRole, callerOutletId = null }: UsersListProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const canManageUsers = callerRole === "admin" || callerRole === "outlet_manager";

  function canManageTarget(user: User) {
    if (callerRole === "admin") {
      return user.role !== "admin";
    }

    if (callerRole === "outlet_manager") {
      return user.role === "outlet_accountant" && user.outletId === callerOutletId;
    }

    return false;
  }

  async function handleDelete(userId: string) {
    setDeletingId(userId);
    const result = await deleteUser(userId);
    if (result.success) {
      toast.success("User deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete user");
    }
    setDeletingId(null);
  }

  return (
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
              <div key={user.id}>
                {/* User row */}
                <div className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role ?? ""] || "bg-gray-100 text-gray-800"}`}>
                          {ROLE_LABELS[user.role ?? ""] || user.role}
                        </span>
                        {user.isActive === "false" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </span>
                        {user.outlet && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {user.outlet.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        Created {user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy") : "N/A"}
                      </p>
                    </div>

                    {canManageUsers && canManageTarget(user) && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                        >
                          {editingUserId === user.id
                            ? <X className="h-4 w-4" />
                            : <Pencil className="h-4 w-4" />
                          }
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={user.role === "admin" || deletingId === user.id}
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline edit form — admin only */}
                {canManageUsers && canManageTarget(user) && editingUserId === user.id && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-4 pb-3">
                      Edit User
                    </p>
                    <UserForm
                      outlets={outlets}
                      user={{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role ?? "outlet_manager",
                        outletId: user.outletId,
                        isActive: user.isActive ?? "true",
                      }}
                      allowedRoles={
                        callerRole === "outlet_manager"
                          ? ["outlet_accountant"]
                          : ["admin", "ho_accountant", "outlet_manager", "outlet_accountant"]
                      }
                      forcedOutletId={callerRole === "outlet_manager" ? callerOutletId ?? undefined : undefined}
                      lockRole={callerRole === "outlet_manager"}
                      lockOutlet={callerRole === "outlet_manager"}
                      onSuccess={() => {
                        setEditingUserId(null);
                        router.refresh();
                      }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
