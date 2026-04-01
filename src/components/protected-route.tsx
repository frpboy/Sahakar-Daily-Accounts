"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { hasPermission, Permission } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: Permission;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredPermission && user) {
    if (!hasPermission(user.role as any, requiredPermission)) {
      if (fallback) return <>{fallback}</>;
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-500 mt-2">
              You don&apos;t have permission to view this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
