"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ApiStatus } from "./ApiStatus";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/seeker", label: "Job seeker" },
  { href: "/employer", label: "Employer" },
  { href: "/officer", label: "Officer" },
];

function Logo() {
  // A small arch bridge
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
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight text-accent">
          <Logo />
          <span className="hidden text-ink sm:inline">SkillBridge</span>
        </Link>
        <nav aria-label="Portals" className="ml-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:ml-4">
          {links.map((l) => {
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
        <ApiStatus />
        <ThemeToggle />
      </div>
    </header>
  );
}
