"use client";

import { useEffect, useState } from "react";
import { DailyEntryForm } from "@/components/forms/DailyEntryForm";
import { Container } from "@/components/ui/container";

interface Outlet {
  id: string;
  name: string;
}

export default function EntryPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    fetchOutlets();
  }, []);

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

  const canSeeAllOutlets = true;
  const defaultOutletId = undefined;

  return (
    <Container className="py-8">
        <div className="max-w-3xl mx-auto">

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
  );
}
