"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "./login/page";
import { Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "candidate") {
        router.replace("/seeker");
      } else if (user.role === "recruiter") {
        router.replace("/employer");
      } else if (user.role === "admin") {
        router.replace("/officer");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl py-16 space-y-4" aria-busy="true" aria-label="Loading session">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  // If already logged in, show brief redirecting state while router transitions
  if (user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="font-display text-lg font-semibold">Welcome back, {user.name}!</p>
        <p className="mt-1 text-xs text-muted">Opening your {user.role} dashboard...</p>
      </div>
    );
  }

  // Starting state (Not logged in): Authentication is displayed right at the start!
  return <LoginPage />;
}
