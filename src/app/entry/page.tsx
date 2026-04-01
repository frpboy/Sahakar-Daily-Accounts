"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { DailyEntryForm } from "@/components/forms/DailyEntryForm";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";

interface Outlet {
  id: string;
  name: string;
}

export default function EntryPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchOutlets();
    }
  }, [user]);

  async function fetchOutlets() {
    try {
      const response = await fetch("/api/outlets-list");
      if (response.ok) {
        const data = await response.json();
        setOutlets(data);
      }
    } catch (error) {
      console.error("Failed to fetch outlets:", error);
    } finally {
      setIsDataLoading(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const canSeeAllOutlets =
    user.role === "admin" || user.role === "ho_accountant";
  const defaultOutletId = canSeeAllOutlets
    ? undefined
    : user.outletId || undefined;

  return (
    <>
      <TopNav />
      <Container className="py-8">
        <div className="max-w-3xl mx-auto">
          {!canSeeAllOutlets && !user.outletId && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800">
                  Your account has not been assigned to an outlet yet. Please
                  contact the administrator.
                </p>
              </CardContent>
            </Card>
          )}

          {!canSeeAllOutlets && user.outletId && (
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold">{user.outletName}</h1>
              <p className="text-gray-500">Daily Entry</p>
            </div>
          )}

          {isDataLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <DailyEntryForm
              outlets={outlets}
              defaultOutletId={defaultOutletId}
              isAdmin={canSeeAllOutlets}
            />
          )}
        </div>
      </Container>
    </>
  );
}
