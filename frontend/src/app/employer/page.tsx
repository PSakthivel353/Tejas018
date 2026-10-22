"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { RejectFeedbackModal } from "@/components/employer/RejectFeedbackModal";
import { ScheduleInterviewModal } from "@/components/employer/ScheduleInterviewModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge, Button, Card, CardHeader, EmptyState, Notice, PageHeader, SkillChip } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  getApplicationsForEmployer,
  storeRejectCandidate,
  storeScheduleInterview,
  storeSelectCandidate,
} from "@/lib/store";
import type { ApplicationStatus, Candidate, InterviewDetails, RejectReason } from "@/lib/types";
import { cn, percent } from "@/lib/utils";

export default function EmployerPage() {
  return (
    <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
      <EmployerContent />
    </ProtectedRoute>
  );
}

function EmployerContent() {
  const { user } = useAuth();
  const employerId = user?.employer_id || 1;

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("all");

  // Modals state
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [rejectCandidate, setRejectCandidate] = useState<Candidate | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setCandidates(getApplicationsForEmployer(employerId));
  }, [employerId]);

  useEffect(() => {
    loadData();
    window.addEventListener("skillbridge_store_updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("skillbridge_store_updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

  // Handle Schedule Interview
  const handleScheduleSubmit = (details: InterviewDetails) => {
    if (!interviewCandidate) return;
    storeScheduleInterview(interviewCandidate.application_id, details);
    setInterviewCandidate(null);
    setActionNotice(`Interview scheduled with ${interviewCandidate.name}. Candidate notified.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Handle Select / Hire Candidate
  const handleSelect = (candidate: Candidate) => {
    storeSelectCandidate(candidate.application_id, "Candidate passed evaluation and selected for the role.");
    setActionNotice(`${candidate.name} has been selected! Offer status updated.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Handle Reject Candidate with Mandatory Feedback
  const handleRejectSubmit = (reason: RejectReason, feedback: string, missingSkill: string) => {
    if (!rejectCandidate) return;
    storeRejectCandidate(rejectCandidate.application_id, reason, feedback, missingSkill);
    setRejectCandidate(null);
    setActionNotice(`Candidate rejected and removed from your dashboard. Feedback delivered to candidate profile.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Only display candidates who are NOT rejected in the recruiter dashboard
  const activeCandidates = useMemo(() => {
    return candidates.filter((c) => c.status !== "rejected");
  }, [candidates]);

  // Statistics
  const total = activeCandidates.length;
  const pending = activeCandidates.filter((c) => c.status === "pending").length;
  const interviewScheduled = activeCandidates.filter((c) => c.status === "interview_scheduled").length;
  const hired = activeCandidates.filter((c) => c.status === "hired").length;

  const filtered = useMemo(() => {
    if (filter === "all") return activeCandidates;
    return activeCandidates.filter((c) => c.status === filter);
  }, [activeCandidates, filter]);



  return (
    <div className="space-y-8">
      {/* Modals */}
      {interviewCandidate && (
        <ScheduleInterviewModal
          candidate={interviewCandidate}
          onSchedule={handleScheduleSubmit}
          onClose={() => setInterviewCandidate(null)}
        />
      )}

      {rejectCandidate && (
        <RejectFeedbackModal
          candidate={rejectCandidate}
          onReject={handleRejectSubmit}
          onClose={() => setRejectCandidate(null)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Candidate Pipeline & Hiring Decision Manager"
          description={`Review matched applicants, schedule interviews, and make hiring decisions. Status updates sync simultaneously with candidate profiles.`}
        />
        <Link href="/employer/post-job">
          <Button variant="primary" className="gap-2">
            <Plus size={16} /> Post New Vacancy
          </Button>
        </Link>
      </div>

      {actionNotice && <Notice kind="success">{actionNotice}</Notice>}

      {/* PIPELINE METRIC STRIP */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        <div className="bg-surface px-4 py-3.5">
          <dt className="text-xs text-muted">Active Applicants</dt>
          <dd className="mt-1 font-display text-2xl font-bold">{total}</dd>
        </div>
        <div className="bg-surface px-4 py-3.5">
          <dt className="text-xs text-muted">Awaiting Review</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-accent">{pending}</dd>
        </div>
        <div className="bg-surface px-4 py-3.5">
          <dt className="text-xs text-muted">Interviews Scheduled</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-amber-500">{interviewScheduled}</dd>
        </div>
        <div className="bg-surface px-4 py-3.5">
          <dt className="text-xs text-muted">Selected / Hired</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-good">{hired}</dd>
        </div>
      </dl>

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-1 border-b border-line pb-2" role="group" aria-label="Filter candidates">
        {[
          { key: "all" as const, label: `All Active Candidates (${total})` },
          { key: "pending" as const, label: `Pending Review (${pending})` },
          { key: "interview_scheduled" as const, label: `Interviews (${interviewScheduled})` },
          { key: "hired" as const, label: `Selected (${hired})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-medium transition-colors",
              filter === tab.key
                ? "bg-accent font-semibold text-accent-ink"
                : "text-muted hover:bg-sunken hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CANDIDATES LIST */}
      {filtered.length === 0 ? (
        <EmptyState title="No candidates in this stage">
          Switch filters above or wait for more candidates to apply to your vacancies.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {filtered.map((candidate) => (
            <Card key={candidate.application_id} className="overflow-hidden">
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold">{candidate.name}</h3>
                      <Badge
                        tone={
                          candidate.status === "hired"
                            ? "good"
                            : candidate.status === "interview_scheduled"
                              ? "signal"
                              : candidate.status === "rejected"
                                ? "bad"
                                : "accent"
                        }
                      >
                        {candidate.status === "hired"
                          ? "Selected"
                          : candidate.status === "interview_scheduled"
                            ? "Interview Scheduled"
                            : candidate.status === "rejected"
                              ? "Rejected"
                              : "Pending Review"}
                      </Badge>
                    </div>

                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span className="font-semibold text-accent">{candidate.trade}</span>
                      <span>•</span>
                      <span>Applied for: <span className="font-medium text-ink">{candidate.job_title}</span></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {candidate.distance_km.toFixed(1)} km away
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-display text-lg font-bold text-accent">{percent(candidate.score)}</span>
                    <span className="block text-xs text-muted">Skill Match</span>
                  </div>
                </div>

                {/* SKILLS CHIPS */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill) => (
                    <SkillChip key={skill}>{skill}</SkillChip>
                  ))}
                  {candidate.missing_skills?.map((missing) => (
                    <SkillChip key={missing} missing>
                      Missing: {missing}
                    </SkillChip>
                  ))}
                </div>

                {/* INTERVIEW DETAILS (IF SCHEDULED) */}
                {candidate.status === "interview_scheduled" && candidate.interview_at && (
                  <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-ink">
                    <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
                      <Calendar size={14} />
                      <span>
                        Interview Set:{" "}
                        {new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(
                          new Date(candidate.interview_at),
                        )}
                      </span>
                    </div>
                    <p className="mt-1">
                      <span className="font-medium text-muted">Mode / Location: </span>
                      {candidate.interview_location}
                    </p>
                  </div>
                )}

                {/* REJECTION FEEDBACK (IF REJECTED) */}
                {candidate.status === "rejected" && (
                  <div className="mt-4 rounded-lg border border-bad/30 bg-bad/10 p-3.5 text-xs text-ink">
                    <p className="font-semibold text-bad">
                      Rejection Reason: <span className="capitalize">{candidate.reject_reason?.replace("_", " ")}</span>
                    </p>
                    {candidate.reject_feedback && (
                      <p className="mt-1 text-muted">
                        <span className="font-medium text-ink">Feedback Given: </span>
                        {candidate.reject_feedback}
                      </p>
                    )}
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line/60 pt-4">
                  {candidate.status === "hired" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-good">
                      <CheckCircle2 size={15} /> Candidate Hired & Offer Released
                    </span>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 text-xs"
                        onClick={() => setInterviewCandidate(candidate)}
                      >
                        <Calendar size={14} className="text-accent" />
                        {candidate.status === "interview_scheduled" ? "Reschedule Interview" : "Schedule Interview"}
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        className="gap-1.5 text-xs bg-good hover:bg-good/90"
                        onClick={() => handleSelect(candidate)}
                      >
                        <UserCheck size={14} /> Select / Hire
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 text-xs text-bad hover:bg-bad/10 hover:border-bad"
                        onClick={() => setRejectCandidate(candidate)}
                      >
                        <UserX size={14} /> Reject with Feedback
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
