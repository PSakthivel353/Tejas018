import { BadgeCheck, MapPin } from "lucide-react";
import { useState } from "react";
import { Badge, Button, EmptyState, Notice, Skeleton, SkillChip } from "@/components/ui";
import type { Candidate, JobMatch, SeekerProfile } from "@/lib/types";
import { errorMessage, percent, rupees } from "@/lib/utils";

type Props = {
  jobs: JobMatch[];
  loading: boolean;
  radius: number;
  profile: SeekerProfile | null;
  applications: Candidate[];
  onApply: (job: JobMatch) => Promise<void>;
};

function MatchRow({
  job,
  profile,
  application,
  onApply,
}: {
  job: JobMatch;
  profile: SeekerProfile | null;
  application?: Candidate;
  onApply: (job: JobMatch) => Promise<void>;
}) {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wage =
    job.wage_min && job.wage_max ? `${rupees(job.wage_min)} to ${rupees(job.wage_max)} a month` : null;

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
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold">{job.title}</h3>
          <p className="text-sm text-muted">{job.employer}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none text-accent">{percent(job.score)}</p>
          <p className="mt-1 text-xs text-muted">match</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin size={14} aria-hidden /> {job.distance_km.toFixed(1)} km away
        </span>
        {wage && <span>{wage}</span>}
        {job.is_formal ? (
          <Badge tone="good">
            <BadgeCheck size={12} aria-hidden /> Formal job with payslip
          </Badge>
        ) : (
          <Badge tone="warn">Informal</Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.matched_skills.map((s) => (
          <SkillChip key={s}>{s}</SkillChip>
        ))}
        {job.missing_skills.map((s) => (
          <SkillChip key={s} missing>
            Missing: {s}
          </SkillChip>
        ))}
      </div>
      {job.bridge_course && (
        <p className="mt-2 text-sm">
          <span className="text-muted">Short course to close the gap: </span>
          {job.bridge_course}
        </p>
      )}
      <div className="mt-4">
        {application ? (
          <div className="space-y-2">
            <Badge tone={application.status === "hired" ? "good" : application.status === "rejected" ? "bad" : "accent"}>
              {application.status === "hired"
                ? "Hired - congratulations!"
                : application.status === "rejected"
                  ? "Not selected - see your application update"
                  : "Application submitted"}
            </Badge>
          </div>
        ) : (
          <Button size="sm" onClick={apply} loading={applying} disabled={!profile}>
            Apply
          </Button>
        )}
        {error && (
          <div className="mt-2">
            <Notice kind="error">{error}</Notice>
          </div>
        )}
      </div>
    </li>
  );
}

export function JobMatches({ jobs, loading, radius, profile, applications, onApply }: Props) {
  if (loading) {
    return (
      <div className="space-y-4 p-5" aria-busy="true" aria-label="Finding jobs">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        ))}
      </div>
    );
  }
  if (jobs.length === 0) {
    return (
      <EmptyState title={`No openings within ${radius} km yet`}>
        Try a wider distance. New vacancies are added as employers post them.
      </EmptyState>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {jobs.map((job) => (
        <MatchRow
          key={job.vacancy_id}
          job={job}
          profile={profile}
          application={applications.find((item) => item.vacancy_id === job.vacancy_id)}
          onApply={onApply}
        />
      ))}
    </ul>
  );
}
