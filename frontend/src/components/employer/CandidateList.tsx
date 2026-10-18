"use client";

import { MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardHeader, EmptyState, Notice, Skeleton, SkillChip } from "@/components/ui";
import { EMPLOYER_ID, getCandidates, rejectCandidate } from "@/lib/api";
import type { Candidate, RejectReason } from "@/lib/types";
import { cn, errorMessage, percent } from "@/lib/utils";

export const REASONS: { value: RejectReason; label: string }[] = [
  { value: "skills_mismatch", label: "Skills do not fit" },
  { value: "too_far", label: "Lives too far" },
  { value: "salary_expectation", label: "Pay expectation" },
  { value: "experience", label: "Not enough experience" },
  { value: "other", label: "Other" },
];
const reasonLabel = (r?: RejectReason | null) => REASONS.find((x) => x.value === r)?.label ?? "No reason given";

// ---- The 2-click rejection ----------------------------------------------------------------------
// Click 1: "Reject" opens the reasons.  Click 2: pick a reason, and it is saved.
// The reason is data: the officer dashboard can later show WHY local candidates are turned away.

function RejectControl({ name, onReject }: { name: string; onReject: (reason: RejectReason) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} aria-label={`Reject ${name}`}>
        Reject
      </Button>
    );
  }
  return (
    <div
      role="group"
      aria-label={`Reason for rejecting ${name}`}
      className="flex flex-wrap items-center gap-1.5"
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <span className="text-xs text-muted">Why?</span>
      {REASONS.map((r, i) => (
        <button
          key={r.value}
          type="button"
          autoFocus={i === 0}
          onClick={() => {
            setOpen(false);
            onReject(r.value);
          }}
          className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs transition-colors hover:border-bad hover:text-bad"
        >
          {r.label}
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}

// ---- Tracker summary -----------------------------------------------------------------------------

function RejectionTracker({ candidates }: { candidates: Candidate[] }) {
  const rejected = candidates.filter((c) => c.status === "rejected");
  const counts = REASONS.map((r) => ({ ...r, n: rejected.filter((c) => c.reject_reason === r.value).length })).filter((r) => r.n > 0);
  const max = Math.max(1, ...counts.map((c) => c.n));

  return (
    <div className="border-b border-line bg-sunken px-5 py-3">
      <p className="text-sm">
        <span className="font-semibold">{rejected.length}</span> of {candidates.length} rejected
      </p>
      {counts.length > 0 && (
        <ul className="mt-2 space-y-1.5" aria-label="Reasons for rejection">
          {counts.map((c) => (
            <li key={c.value} className="flex items-center gap-3 text-xs">
              <span className="w-36 shrink-0 text-muted">{c.label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-bad" style={{ width: `${(c.n / max) * 100}%` }} />
              </span>
              <span className="w-4 text-right tabular-nums">{c.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- The list ----------------------------------------------------------------------------------------

export function CandidateList({ refreshKey }: { refreshKey: number }) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [view, setView] = useState<"new" | "rejected">("new");

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setCandidates(await getCandidates(EMPLOYER_ID));
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [load, refreshKey]);

  async function reject(candidate: Candidate, reason: RejectReason) {
    setActionError(null);
    const previous = candidates;
    // Update the screen first so it feels instant, undo if the server says no.
    setCandidates((list) =>
      list ? list.map((c) => (c.application_id === candidate.application_id ? { ...c, status: "rejected", reject_reason: reason } : c)) : list,
    );
    try {
      await rejectCandidate(candidate.application_id, reason);
    } catch (e) {
      setCandidates(previous);
      setActionError(`Could not reject ${candidate.name}. ${errorMessage(e)}`);
    }
  }

  const shown = useMemo(
    () => (candidates ?? []).filter((c) => (view === "new" ? c.status !== "rejected" : c.status === "rejected")),
    [candidates, view],
  );
  const rejectedCount = (candidates ?? []).filter((c) => c.status === "rejected").length;

  return (
    <Card className="self-start">
      <CardHeader title="Candidates" description="People whose skills and location fit your vacancies, best match first." />

      {candidates && <RejectionTracker candidates={candidates} />}

      <div className="flex gap-1 border-b border-line px-5 py-2" role="group" aria-label="Show candidates">
        {(["new", "rejected"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={cn(
              "rounded px-3 py-1.5 text-sm transition-colors",
              view === v ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:bg-sunken hover:text-ink",
            )}
          >
            {v === "new" ? `Active (${(candidates?.length ?? 0) - rejectedCount})` : `Rejected (${rejectedCount})`}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="px-5 pt-4">
          <Notice kind="error">{actionError}</Notice>
        </div>
      )}

      {loadError ? (
        <div className="p-5">
          <Notice kind="error">{loadError}</Notice>
        </div>
      ) : candidates === null ? (
        <div className="space-y-4 p-5" aria-busy="true" aria-label="Loading candidates">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState title={view === "new" ? "No active candidates" : "No one rejected yet"}>
          {view === "new" ? "Post a vacancy and matching candidates will appear here." : "Rejected candidates and their reasons show up here."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((c) => (
            <li key={c.application_id} className={cn("px-5 py-4", c.status === "rejected" && "opacity-70")}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold">{c.name}</h3>
                  <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
                    <span>{c.trade}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} aria-hidden /> {c.distance_km.toFixed(1)} km
                    </span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-xl font-bold leading-none text-accent">{percent(c.score)}</p>
                  <p className="mt-1 text-xs text-muted">match</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.skills.map((s) => (
                  <SkillChip key={s}>{s}</SkillChip>
                ))}
              </div>
              <div className="mt-3">
                {c.status === "rejected" ? (
                  <Badge tone="bad">Rejected: {reasonLabel(c.reject_reason)}</Badge>
                ) : (
                  <RejectControl name={c.name} onReject={(reason) => reject(c, reason)} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
