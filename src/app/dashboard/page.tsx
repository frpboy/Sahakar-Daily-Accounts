import { Suspense } from "react";
import { redirect } from "next/navigation";
import AdminView from "@/components/dashboards/AdminView";
import OutletDashboardView from "@/components/dashboards/OutletDashboardView";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { outlets, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const [dbUser] = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      outletId: users.outletId,
    })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!dbUser?.role) {
    redirect("/login");
  }

  if (dbUser.role === "admin" || dbUser.role === "ho_accountant") {
    return (
      <Suspense>
        <AdminView />
      </Suspense>
    );
  }

  const [outlet] = dbUser.outletId
    ? await db
        .select({ id: outlets.id, name: outlets.name })
        .from(outlets)
        .where(eq(outlets.id, dbUser.outletId))
        .limit(1)
    : [];

  return (
    <OutletDashboardView
      userName={dbUser.name}
      role={dbUser.role}
      outletName={outlet?.name ?? null}
    />
  );
}
