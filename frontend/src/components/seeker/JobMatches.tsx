"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import { Badge, Button, EmptyState, Notice, Skeleton, SkillChip } from "@/components/ui";
import type { Candidate, JobMatch, SeekerProfile } from "@/lib/types";
import { cn, errorMessage, percent, rupees } from "@/lib/utils";

type Props = {
  jobs: JobMatch[];
  loading: boolean;
  radius: number;
  profile: SeekerProfile | null;
  applications: Candidate[];
  onApply: (job: JobMatch) => Promise<void>;
};

function JobCard({
  job,
  profile,
  onApply,
}: {
  job: JobMatch;
  profile: SeekerProfile | null;
  onApply: (job: JobMatch) => Promise<void>;
}) {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wage =
    job.wage_min && job.wage_max
      ? `${rupees(job.wage_min)} - ${rupees(job.wage_max)} / mo`
      : null;

  async function apply() {
    setApplying(true);
    setError(null);
    try {
      await onApply(job);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-line bg-surface p-5 transition-all duration-300",
        "hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-accent/5",
      )}
    >
      {/* Top Header: Title, Employer, Match Badge */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-bold text-ink transition-colors group-hover:text-accent">
              {job.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Building2 size={13} className="shrink-0" />
              <span className="truncate font-medium text-ink">{job.employer}</span>
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
              <Sparkles size={12} /> {percent(job.score)}
            </span>
          </div>
        </div>

        {/* Location & Wage Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1 rounded bg-sunken px-2 py-0.5">
            <MapPin size={12} className="text-muted" /> {job.distance_km.toFixed(1)} km away
          </span>
          {wage && (
            <span className="inline-flex items-center rounded bg-sunken px-2 py-0.5 font-medium text-ink">
              {wage}
            </span>
          )}
          {job.is_formal ? (
            <Badge tone="good" className="text-[11px]">
              <BadgeCheck size={12} /> Formal Job
            </Badge>
          ) : (
            <Badge tone="neutral" className="text-[11px]">
              Informal
            </Badge>
          )}
        </div>

        {/* Description Snippet (if any) */}
        {job.description && (
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted">
            {job.description}
          </p>
        )}

        {/* Skills Alignment */}
        <div className="mt-3.5 space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Skill Compatibility</span>
          <div className="flex flex-wrap gap-1.5">
            {job.matched_skills.map((s) => (
              <SkillChip key={s}>{s}</SkillChip>
            ))}
            {job.missing_skills.map((s) => (
              <SkillChip key={s} missing>
                Missing: {s}
              </SkillChip>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Area: ONLY Apply Now */}
      <div className="mt-5 border-t border-line/60 pt-3.5">
        {error && (
          <div className="mb-2">
            <Notice kind="error">{error}</Notice>
          </div>
        )}

        <Button
          size="md"
          variant="primary"
          onClick={apply}
          loading={applying}
          disabled={!profile}
          className="w-full gap-2 transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-md"
        >
          <span>Apply Now</span>
          <Send size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}

export function JobMatches({ jobs, loading, radius, profile, applications, onApply }: Props) {
  // Move applied jobs to applied jobs section; only show openings that can be applied to
  const appliedVacancyIds = new Set(applications.map((a) => a.vacancy_id));
  const availableJobs = jobs.filter((j) => !appliedVacancyIds.has(j.vacancy_id));

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading jobs">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded pt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (availableJobs.length === 0 && jobs.length > 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-good/15 text-good">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="font-display text-lg font-bold text-ink">All Matched Openings Applied!</h3>
        <p className="text-xs text-muted max-w-md mx-auto">
          You have applied to all {jobs.length} local openings matching your profile. Track your applications, interview schedules, and recruiter feedback in your Applied Jobs portal.
        </p>
        <div className="pt-2">
          <Link href="/seeker/applications">
            <Button variant="primary" size="sm" className="gap-2">
              View Applied Jobs ({applications.length})
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (availableJobs.length === 0) {
    return (
      <EmptyState title={`No openings found within ${radius} km`}>
        Try expanding the distance radius above to 80 km or updating your skill competencies.
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {availableJobs.map((job) => (
        <JobCard
          key={job.vacancy_id}
          job={job}
          profile={profile}
          onApply={onApply}
        />
      ))}
    </div>
  );
}
