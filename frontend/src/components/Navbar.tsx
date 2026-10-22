"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, RotateCcw, User as UserIcon } from "lucide-react";
import { ApiStatus } from "./ApiStatus";
import { ThemeToggle } from "./ThemeToggle";
import { Badge, Button } from "./ui";
import { useAuth } from "@/lib/auth";
import { getStoredApplications, resetAllDemoData } from "@/lib/store";
import type { Candidate } from "@/lib/types";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 18h20" />
      <path d="M4 18c0-5.5 3.6-10 8-10s8 4.5 8 10" />
      <path d="M8 18v-5M12 18V8M16 18v-5" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [appCount, setAppCount] = useState(0);

  // Keep live application count for candidate badge
  useEffect(() => {
    const updateCount = () => {
      if (user?.role === "candidate") {
        const apps = getStoredApplications().filter((a: Candidate) => a.seeker_id === (user.seeker_id || 101));
        setAppCount(apps.length);
      }
    };
    updateCount();
    window.addEventListener("skillbridge_store_updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("skillbridge_store_updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, [user]);

  // When not logged in: NO portal links should be shown at all.
  // When logged in: ONLY show that specific user's respective dashboard tabs.
  const getLinks = () => {
    if (!user) {
      return [];
    }
    if (user.role === "candidate") {
      return [
        { href: "/seeker", label: "Job Matches" },
        { href: "/seeker/applications", label: `Applied Jobs (${appCount})` },
        { href: "/seeker/profile", label: "My Profile & Courses" },
      ];
    }
    if (user.role === "recruiter") {
      return [
        { href: "/employer", label: "Candidate Pipeline" },
        { href: "/employer/post-job", label: "Post a Job" },
      ];
    }
    // Admin
    return [
      { href: "/officer", label: "District Officer Overview" },
    ];
  };

  const navLinks = getLinks();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleBadgeTone: Record<string, "accent" | "good" | "signal"> = {
    candidate: "accent",
    recruiter: "good",
    admin: "signal",
  };

  const roleTitle: Record<string, string> = {
    candidate: "Candidate",
    recruiter: "Recruiter",
    admin: "Admin",
  };

  const brandDestination = !user
    ? "/"
    : user.role === "candidate"
      ? "/seeker"
      : user.role === "recruiter"
        ? "/employer"
        : "/officer";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href={brandDestination} className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight text-accent">
            <Logo />
            <span className="hidden text-ink sm:inline">SkillBridge</span>
          </Link>
          {navLinks.length > 0 && (
            <nav aria-label="Portals" className="flex items-center gap-1 overflow-x-auto">
              {navLinks.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "shrink-0 rounded px-2.5 py-1.5 text-sm transition-colors sm:px-3",
                      active ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:bg-sunken hover:text-ink",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden flex-col items-end text-right sm:flex">
                <span className="text-xs font-semibold leading-tight text-ink">{user.name}</span>
                <span className="text-[10px] text-muted">ID: {user.id}</span>
              </div>
              <Badge tone={roleBadgeTone[user.role] || "accent"} className="text-[11px] capitalize">
                {roleTitle[user.role]}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="h-8 px-2 text-muted hover:text-bad"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                <UserIcon size={14} /> Sign In / Register
              </Button>
            </Link>
          )}

          <div className="h-4 w-px bg-line" aria-hidden />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetAllDemoData();
            }}
            title="Reset all demo data to default baseline"
            aria-label="Reset demo data"
            className="h-8 gap-1 px-2 text-xs text-muted hover:text-ink"
          >
            <RotateCcw size={13} />
            <span className="hidden md:inline">Reset Demo</span>
          </Button>
          <ApiStatus />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
