import { db } from "@/db";
import { outlets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
// import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { DailyEntryForm } from "@/components/forms/DailyEntryForm";
import { Container } from "@/components/ui/container";

interface PageProps {
  params: Promise<{ outletId: string }>;
}

export default async function OutletEntryPage({ params }: PageProps) {
  const { outletId } = await params;

  // Get user role from our DB
  const outlet = await db.query.outlets.findFirst({
    where: eq(outlets.id, outletId),
  });

  if (!outlet) {
    notFound();
  }

  const isAdmin = true;

  // We'll pass the list of outlets just in case the form needs it
  // But for manager, it should be auto-selected as user's outlet
  const allOutlets = await db.query.outlets.findMany();

  return (
    <>
      <TopNav />
      <Container className="py-8">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-2xl font-bold">Daily Entry - {outlet.name}</h1>
          <p className="text-gray-600">Enter transaction details for today</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <DailyEntryForm
            outlets={allOutlets.map((o) => ({ id: o.id, name: o.name }))}
            defaultOutletId={outletId}
            isAdmin={isAdmin}
          />
        </div>
      </Container>
    </>
  );
}
