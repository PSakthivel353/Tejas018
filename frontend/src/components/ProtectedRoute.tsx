"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in: Redirect to authentication at start
        router.replace("/login");
      } else if (!allowedRoles.includes(user.role)) {
        // Logged in with a different role: Redirect immediately to their own respective dashboard
        const ownDashboard =
          user.role === "candidate" ? "/seeker" : user.role === "recruiter" ? "/employer" : "/officer";
        router.replace(ownDashboard);
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="space-y-6 py-8" aria-busy="true" aria-label="Authenticating session">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If not logged in or role not permitted, render null while redirection takes place
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
