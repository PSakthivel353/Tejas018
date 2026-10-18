"use client";

import { useSyncExternalStore } from "react";
import { getStatus, getStatusVersion, subscribeStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

// Small pill in the navbar: tells the team whether the screen is showing real or demo data.
// Hover it to see exactly which endpoints are still on demo data.
export function ApiStatus() {
  useSyncExternalStore(subscribeStatus, getStatusVersion, () => 0);
  const { api, mock } = getStatus();
  if (api === 0 && mock.length === 0) return null;

  const demo = mock.length > 0;
  const text = !demo ? "Live API" : api > 0 ? `Demo data: ${mock.length}` : "Demo data";
  const title = demo ? `Still on demo data: ${mock.join(", ")}` : "Every call reached the backend";

  return (
    <span
      title={title}
      className={cn(
        "hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex",
        demo ? "border-signal/60 bg-signal/20" : "border-good/40 bg-good/10 text-good",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", demo ? "bg-signal" : "bg-good")} aria-hidden />
      {text}
    </span>
  );
}
