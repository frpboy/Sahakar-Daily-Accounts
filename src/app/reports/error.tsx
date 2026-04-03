"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-8">
      <div className="text-center py-16">
        <p className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</p>
        <p className="text-sm text-gray-500 mb-6">
          Reports could not be loaded. Please try again.
        </p>
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
      </div>
    </Container>
  );
}
