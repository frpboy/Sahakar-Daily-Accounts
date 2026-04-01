import { TopNav } from "@/components/shared/TopNav";
import { DailyEntryForm } from "@/components/forms/DailyEntryForm";
import { getAllOutlets } from "@/lib/actions/accounts";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";

export default async function EntryPage() {
  // TODO: Replace with Neon Auth when configured
  // const { sessionClaims } = auth();
  // const metadata = sessionClaims?.metadata as any;
  //
  // if (!metadata) {
  //   redirect("/sign-in");
  // }

  const isAdmin = false; // TODO: Get from Neon Auth
  const defaultOutletId = undefined; // TODO: Get from Neon Auth

  const outletsResult = await getAllOutlets();
  const outlets = outletsResult.success && outletsResult.data
    ? outletsResult.data.map(o => ({ id: o.id, name: o.name }))
    : [];

  return (
    <>
      <TopNav isAdmin={isAdmin} />
      <Container className="py-8">
        <div className="max-w-3xl mx-auto">
          {!isAdmin && !defaultOutletId && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800">
                  Your account has not been assigned to an outlet yet. Please
                  contact the administrator.
                </p>
              </CardContent>
            </Card>
          )}

          <DailyEntryForm
            outlets={outlets}
            defaultOutletId={defaultOutletId}
            isAdmin={isAdmin}
          />
        </div>
      </Container>
    </>
  );
}
