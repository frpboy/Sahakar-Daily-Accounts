"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Application Error
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              The error has been reported. Try reloading this screen.
            </p>
            <button
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-700"
              onClick={() => reset()}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
