import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, outlets, dailyAccounts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { canAccessAllOutlets } from "@/lib/permissions";
import { DailyEntryForm } from "@/components/forms/DailyEntryForm";
import { Container } from "@/components/ui/container";
import { parseDateInput } from "@/lib/utils";
import { getEntryById } from "@/lib/actions/accounts";

interface EntryPageProps {
  searchParams: Promise<{ date?: string; outletId?: string; entryId?: string }>;
}

export default async function EntryPage({ searchParams }: EntryPageProps) {
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

  // Pre-fill with existing entry if ?date= is provided
  const params = await searchParams;
  const editDate = params.date;
  const editOutletId = isAdmin ? params.outletId : (dbUser.outletId ?? undefined);
  const editEntryId = params.entryId;

  let initialValues: Record<string, unknown> | undefined;
  if (editEntryId) {
    const byId = await getEntryById(editEntryId);
    if (byId.success && byId.data) {
      const existing = byId.data;
      initialValues = {
        entryId: existing.id,
        date: parseDateInput(existing.date),
        outletId: existing.outletId,
        totalSalesAmount:
          parseFloat(existing.saleCash || "0") +
          parseFloat(existing.saleUpi || "0") +
          parseFloat(existing.saleCredit || "0"),
        saleCash: parseFloat(existing.saleCash || "0"),
        saleUpi: parseFloat(existing.saleUpi || "0"),
        saleCredit: parseFloat(existing.saleCredit || "0"),
        saleReturn: parseFloat(existing.saleReturn || "0"),
        expenseBreakdown: Array.isArray(existing.expenseBreakdown)
          ? existing.expenseBreakdown
          : [],
        expenses: parseFloat(existing.expenses || "0"),
        purchase: parseFloat(existing.purchase || "0"),
        closingStock: parseFloat(existing.closingStock || "0"),
      };
    }
  } else if (editDate && editOutletId) {
    const [existing] = await db
      .select()
      .from(dailyAccounts)
      .where(and(eq(dailyAccounts.date, editDate), eq(dailyAccounts.outletId, editOutletId)))
      .orderBy(desc(dailyAccounts.createdAt))
      .limit(1);

    if (existing) {
      initialValues = {
        entryId: existing.id,
        date: parseDateInput(editDate),
        outletId: editOutletId,
        totalSalesAmount:
          parseFloat(existing.saleCash || "0") +
          parseFloat(existing.saleUpi || "0") +
          parseFloat(existing.saleCredit || "0"),
        saleCash: parseFloat(existing.saleCash || "0"),
        saleUpi: parseFloat(existing.saleUpi || "0"),
        saleCredit: parseFloat(existing.saleCredit || "0"),
        saleReturn: parseFloat(existing.saleReturn || "0"),
        expenseBreakdown: Array.isArray(existing.expenseBreakdown)
          ? existing.expenseBreakdown
          : [],
        expenses: parseFloat(existing.expenses || "0"),
        purchase: parseFloat(existing.purchase || "0"),
        closingStock: parseFloat(existing.closingStock || "0"),
      };
    }
  }

  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto">
        <DailyEntryForm
          outlets={outletList}
          defaultOutletId={editOutletId ?? dbUser.outletId ?? undefined}
          isAdmin={isAdmin}
          initialValues={initialValues}
        />
      </div>
    </Container>
  );
}
