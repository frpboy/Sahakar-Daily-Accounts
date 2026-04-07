import Link from "next/link";
import { Building2, FileText, Plus, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OutletDashboardViewProps {
  userName: string;
  role: "outlet_manager" | "outlet_accountant";
  outletName: string | null;
}

const roleLabel = {
  outlet_manager: "Outlet Manager",
  outlet_accountant: "Outlet Accountant",
} as const;

export default function OutletDashboardView({
  userName,
  role,
  outletName,
}: OutletDashboardViewProps) {
  return (
    <Container className="py-8 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
          Dashboard
        </p>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">
          {roleLabel[role]}
        </h1>
        <p className="text-gray-500">
          {userName} {outletName ? `• ${outletName}` : ""}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
              <Plus className="h-4 w-4" />
              Daily Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Create or update the current outlet&apos;s daily account entry.
            </p>
            <Link href="/entry" className="block">
              <Button className="w-full">Open Entry Form</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
              <FileText className="h-4 w-4" />
              Own Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Review your outlet&apos;s entries, filters, edits, and exports.
            </p>
            <Link href="/reports/own" className="block">
              <Button variant="outline" className="w-full">
                Open Own Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
              <Building2 className="h-4 w-4" />
              Outlet Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              {outletName ? `Assigned outlet: ${outletName}` : "No outlet is assigned to this user."}
            </p>
            {role === "outlet_manager" ? (
              <Link href="/admin/users" className="block">
                <Button variant="secondary" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Outlet Staff
                </Button>
              </Link>
            ) : (
              <Link href="/outlets" className="block">
                <Button variant="outline" className="w-full">
                  View Outlets
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
