"use client";

import { MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardHeader, EmptyState, Notice, Skeleton, SkillChip } from "@/components/ui";
import { EMPLOYER_ID, getCandidates, hireCandidate, rejectCandidate } from "@/lib/api";
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

function RejectControl({
  name,
  onReject,
  disabled,
}: {
  name: string;
  onReject: (reason: RejectReason) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} disabled={disabled} aria-label={`Reject ${name}`}>
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
          disabled={disabled}
          onClick={() => {
            setOpen(false);
            onReject(r.value);
          }}
          className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs transition-colors hover:border-bad hover:text-bad"
        >
          {r.label}
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={disabled}>
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
  const [view, setView] = useState<"pending" | "hired" | "rejected">("pending");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setCandidates(await getCandidates(EMPLOYER_ID));
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load, refreshKey]);

  async function updateApplication(candidate: Candidate, update: () => Promise<Candidate>) {
    if (updatingId !== null) return;
    setActionError(null);
    setUpdatingId(candidate.application_id);
    const previous = candidates;
    try {
      const updated = await update();
      setCandidates((list) =>
        list ? list.map((c) => (c.application_id === candidate.application_id ? updated : c)) : list,
      );
    } catch (e) {
      setCandidates(previous);
      setActionError(`Could not update ${candidate.name}'s application. ${errorMessage(e)}`);
    } finally {
      setUpdatingId(null);
    }
  }

  function reject(candidate: Candidate, reason: RejectReason) {
    void updateApplication(candidate, () => rejectCandidate(candidate.application_id, reason));
  }

  function hire(candidate: Candidate) {
    void updateApplication(candidate, () => hireCandidate(candidate.application_id));
  }

  const shown = useMemo(
    () => (candidates ?? []).filter((c) => c.status === view),
    [candidates, view],
  );
  const rejectedCount = (candidates ?? []).filter((c) => c.status === "rejected").length;
  const pendingCount = (candidates ?? []).filter((c) => c.status === "pending").length;
  const hiredCount = (candidates ?? []).filter((c) => c.status === "hired").length;

  return (
    <Card className="self-start">
      <CardHeader title="Applications" description="Review submitted applications and decide whether to hire or reject each person." />

      {candidates && <RejectionTracker candidates={candidates} />}

      <div className="flex flex-wrap gap-1 border-b border-line px-5 py-2" role="group" aria-label="Filter applications">
        {(["pending", "hired", "rejected"] as const).map((v) => (
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
            {v === "pending" ? `Pending (${pendingCount})` : v === "hired" ? `Hired (${hiredCount})` : `Rejected (${rejectedCount})`}
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
        <EmptyState title={`No ${view} applications`}>
          Applications submitted by job seekers will appear here.
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
                  <p className="mt-1 text-sm">
                    Applied for <span className="font-medium">{c.job_title}</span> at {c.employer}
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
                {c.status === "pending" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => void hire(c)}
                      loading={updatingId === c.application_id}
                      disabled={updatingId !== null && updatingId !== c.application_id}
                    >
                      Hire
                    </Button>
                    <RejectControl
                      name={c.name}
                      onReject={(reason) => reject(c, reason)}
                      disabled={updatingId !== null}
                    />
                  </div>
                ) : c.status === "rejected" ? (
                  <div className="space-y-2">
                    <Badge tone="bad">Rejected: {reasonLabel(c.reject_reason)}</Badge>
                    {c.missing_skills.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-muted">Skills to develop</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.missing_skills.map((skill) => <SkillChip key={skill} missing>{skill}</SkillChip>)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Badge tone="good">Hired</Badge>
                    {c.interview_at && (
                      <p className="text-sm text-muted">
                        Interview scheduled: {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(c.interview_at))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
