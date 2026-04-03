import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, outlets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canAccessAllOutlets } from "@/lib/permissions";
import { DailyEntryForm } from "@/components/forms/DailyEntryForm";
import { Container } from "@/components/ui/container";

export default async function EntryPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!dbUser) redirect("/login");

  const isAdmin = canAccessAllOutlets(dbUser.role!);

  let outletList: { id: string; name: string }[];

  if (isAdmin) {
    outletList = await db
      .select({ id: outlets.id, name: outlets.name })
      .from(outlets)
      .orderBy(outlets.name);
  } else {
    if (!dbUser.outletId) {
      return (
        <Container className="py-8">
          <p className="text-center text-red-500">
            No outlet assigned. Please contact your administrator.
          </p>
        </Container>
      );
    }
    outletList = await db
      .select({ id: outlets.id, name: outlets.name })
      .from(outlets)
      .where(eq(outlets.id, dbUser.outletId));
  }

  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto">
        <DailyEntryForm
          outlets={outletList}
          defaultOutletId={dbUser.outletId ?? undefined}
          isAdmin={isAdmin}
        />
      </div>
    </Container>
  );
}
