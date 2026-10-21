import { Badge, Card, CardHeader, SkillChip } from "@/components/ui";
import type { Candidate } from "@/lib/types";

function formatInterviewDate(value?: string | null): string {
  if (!value) return "Interview time will be confirmed by the employer.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Interview time will be confirmed by the employer.";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(date);
}

function ApplicationProgress({ application }: { application: Candidate }) {
  const complete = application.status !== "pending";
  const progress = complete ? 100 : 50;

  return (
    <div className="space-y-2" aria-label={`Application status: ${application.status}`}>
      <div
        role="progressbar"
        aria-label="Application progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-2 overflow-hidden rounded-full bg-sunken"
      >
        <div
          className={`h-full rounded-full transition-[width] ${complete ? "bg-good" : "bg-accent"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between gap-3 text-xs">
        <span className="font-medium text-good">Application submitted</span>
        <span className={complete ? "font-medium text-good" : "font-medium text-accent"}>
          {application.status === "pending"
            ? "Waiting for employer decision"
            : application.status === "hired"
              ? "Hired"
              : "Decision received"}
        </span>
      </div>
    </div>
  );
}

export function ApplicationUpdates({ applications }: { applications: Candidate[] }) {
  if (applications.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Your applications" description="Decisions refresh automatically while this page is open." />
      <ul className="divide-y divide-line">
        {applications.map((application) => (
          <li key={application.application_id} className="space-y-3 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-semibold">{application.job_title}</h3>
                <p className="text-sm text-muted">{application.employer}</p>
              </div>
              <Badge
                tone={
                  application.status === "hired"
                    ? "good"
                    : application.status === "rejected"
                      ? "bad"
                      : "accent"
                }
              >
                {application.status === "hired"
                  ? "Hired - congratulations!"
                  : application.status === "rejected"
                    ? "Not selected"
                    : "Application submitted"}
              </Badge>
            </div>
            <ApplicationProgress application={application} />
            {application.status === "hired" && (
              <div className="rounded border border-good/40 bg-good/10 p-3 text-sm" role="status">
                <p className="font-semibold">Interview scheduled</p>
                <p className="mt-1">Scheduled interview on {formatInterviewDate(application.interview_at)}.</p>
              </div>
            )}
            {application.status === "rejected" && (
              <div className="rounded border border-warn/30 bg-warn/10 p-3 text-sm">
                <p className="font-medium">Skills to build for your next opportunity</p>
                {application.missing_skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {application.missing_skills.map((skill) => (
                      <SkillChip key={skill} missing>
                        {skill}
                      </SkillChip>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-muted">No specific skill gaps were recorded for this job.</p>
                )}
                {application.bridge_course && (
                  <p className="mt-2 text-muted">Suggested learning: {application.bridge_course}</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
