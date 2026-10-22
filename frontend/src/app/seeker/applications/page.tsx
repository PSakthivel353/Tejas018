"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquare,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, SkillChip } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getApplicationsForSeeker, storeEnrollInBridgeCourse } from "@/lib/store";
import type { ApplicationStatus, Candidate } from "@/lib/types";
import { cn, percent } from "@/lib/utils";

export default function AppliedJobsPage() {
  return (
    <ProtectedRoute allowedRoles={["candidate", "admin"]}>
      <AppliedJobsContent />
    </ProtectedRoute>
  );
}

function ApplicationStatusBar({
  status,
  hasInterview = false,
}: {
  status: ApplicationStatus;
  hasInterview?: boolean;
}) {
  const isScreeningRejection = status === "rejected" && !hasInterview;
  const isPostInterviewRejection = status === "rejected" && hasInterview;

  type StepItem = {
    label: string;
    state: "done" | "current" | "rejected" | "upcoming";
  };

  const steps: StepItem[] = [
    {
      label: "Submitted",
      state: "done",
    },
    {
      label: isScreeningRejection ? "Screening (Rejected)" : "Screening Review",
      state: isScreeningRejection
        ? "rejected"
        : status === "pending"
          ? "current"
          : "done",
    },
    {
      label: isPostInterviewRejection
        ? "Interview (Held)"
        : status === "interview_scheduled"
          ? "Interview Set"
          : "Interview",
      state: isScreeningRejection
        ? "upcoming"
        : status === "interview_scheduled"
          ? "current"
          : isPostInterviewRejection || status === "hired"
            ? "done"
            : "upcoming",
    },
    {
      label: isPostInterviewRejection
        ? "Not Selected"
        : status === "hired"
          ? "Hired / Offer"
          : "Decision",
      state: isPostInterviewRejection
        ? "rejected"
        : status === "hired"
          ? "done"
          : "upcoming",
    },
  ];

  return (
    <div className="py-2.5" aria-label={`Application status: ${status}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isDone = step.state === "done";
          const isRejected = step.state === "rejected";
          const isCurrent = step.state === "current";

          return (
            <div key={step.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                    isRejected
                      ? "bg-bad text-bad-ink shadow-xs"
                      : isDone
                        ? "bg-good text-good-ink"
                        : isCurrent
                          ? "bg-accent text-accent-ink ring-4 ring-accent/20"
                          : "border border-line bg-sunken text-muted",
                  )}
                >
                  {isRejected ? "✕" : isDone ? "✓" : idx + 1}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-center text-[11px] leading-tight max-w-[85px]",
                    isRejected
                      ? "font-bold text-bad"
                      : isCurrent
                        ? "font-bold text-ink"
                        : isDone
                          ? "font-medium text-ink"
                          : "text-muted",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-1 flex-1 rounded-full transition-colors",
                    // Connector line coloring: progresses up to the rejection or active step
                    idx === 0
                      ? isScreeningRejection
                        ? "bg-bad/70"
                        : "bg-good"
                      : idx === 1
                        ? isScreeningRejection
                          ? "bg-line"
                          : isPostInterviewRejection || status === "hired"
                            ? "bg-good"
                            : status === "interview_scheduled"
                              ? "bg-accent/40"
                              : "bg-line"
                        : idx === 2
                          ? isPostInterviewRejection
                            ? "bg-bad/70"
                            : status === "hired"
                              ? "bg-good"
                              : "bg-line"
                          : "bg-line",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppliedJobsContent() {
  const { user } = useAuth();
  const seekerId = user?.seeker_id || 101;

  const [applications, setApplications] = useState<Candidate[]>([]);
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("all");
  const [whatsAppPreviewApp, setWhatsAppPreviewApp] = useState<Candidate | null>(null);
  const [enrolledApps, setEnrolledApps] = useState<number[]>([]);

  const getDynamicBridgeCourse = (app: Candidate) => {
    if (app.bridge_course) return app.bridge_course;
    const topMissing = app.missing_skills?.[0];
    if (topMissing) {
      if (topMissing.toLowerCase().includes("offset")) {
        return "Tool Offset Setting & Precision Calibration (3-Week ITI Bridge Course)";
      }
      if (topMissing.toLowerCase().includes("g-code") || topMissing.toLowerCase().includes("programming")) {
        return "CNC G-Code Programming & Setup (4-Week ITI Bridge Course)";
      }
      if (topMissing.toLowerCase().includes("blueprint") || topMissing.toLowerCase().includes("drawing")) {
        return "Engineering Drawing & Blueprint Reading (2-Week ITI Bridge Course)";
      }
      if (topMissing.toLowerCase().includes("micrometer") || topMissing.toLowerCase().includes("vernier")) {
        return "Precision Metrology & Instrument Calibration (2-Week ITI Bridge Course)";
      }
      return `${topMissing} Practical Skills (3-Week ITI Bridge Course)`;
    }
    return "Precision Machining & Shopfloor Practices (3-Week ITI Bridge Course)";
  };

  const handleEnrollBridgeCourse = (app: Candidate) => {
    const courseTitle = getDynamicBridgeCourse(app);
    storeEnrollInBridgeCourse(courseTitle, app.trade || "Engineering");
    setEnrolledApps((prev) => [...prev, app.application_id]);
  };

  const loadData = useCallback(() => {
    setApplications(getApplicationsForSeeker(seekerId));
  }, [seekerId]);

  useEffect(() => {
    loadData();
    window.addEventListener("skillbridge_store_updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("skillbridge_store_updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

  const total = applications.length;
  const pending = applications.filter((a) => a.status === "pending").length;
  const interview = applications.filter((a) => a.status === "interview_scheduled").length;
  const hired = applications.filter((a) => a.status === "hired").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const statusBadge = (s: ApplicationStatus) => {
    switch (s) {
      case "pending":
        return <Badge tone="accent">Under Review</Badge>;
      case "interview_scheduled":
        return <Badge tone="signal">Interview Scheduled</Badge>;
      case "hired":
        return <Badge tone="good">Selected / Offer Made</Badge>;
      case "rejected":
        return <Badge tone="bad">Not Selected</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Applied Jobs & Application Status"
          description="Real-time pipeline tracking. Interview schedules and employer feedback update automatically."
        />
        <Link href="/seeker">
          <Button variant="secondary" className="gap-2">
            <Sparkles size={16} className="text-accent" />
            Find More Jobs
          </Button>
        </Link>
      </div>

      {/* METRIC STRIP */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-5">
        <div className="bg-surface px-4 py-3.5">
          <dt className="text-xs text-muted">Total Applied</dt>
          <dd className="mt-1 font-display text-2xl font-bold">{total}</dd>
        </div>
        <div className="bg-surface px-4 py-3.5">
          <dt className="text-xs text-muted">Under Review</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-accent">{pending}</dd>
        </div>
        <div className="bg-surface px-4 py-3.5">
          <dt className="text-xs text-muted">Interview Scheduled</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-amber-500">{interview}</dd>
        </div>
        <div className="bg-surface px-4 py-3.5">
          <dt className="text-xs text-muted">Selected / Hired</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-good">{hired}</dd>
        </div>
        <div className="bg-surface px-4 py-3.5">
          <dt className="text-xs text-muted">Not Selected</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-bad">{rejected}</dd>
        </div>
      </dl>

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-1 border-b border-line pb-2" role="group" aria-label="Filter status">
        {[
          { key: "all" as const, label: `All (${total})` },
          { key: "pending" as const, label: `In Review (${pending})` },
          { key: "interview_scheduled" as const, label: `Interviews (${interview})` },
          { key: "hired" as const, label: `Selected (${hired})` },
          { key: "rejected" as const, label: `Rejected (${rejected})` },
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

      {/* APPLICATIONS LIST */}
      {filtered.length === 0 ? (
        <EmptyState title="No applications in this category">
          {total === 0 ? (
            <div className="space-y-3">
              <p>You have not applied to any vacancies yet.</p>
              <Link href="/seeker">
                <Button variant="primary">Browse Recommended Jobs</Button>
              </Link>
            </div>
          ) : (
            "Switch filters above to see your other applications."
          )}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <Card key={app.application_id} className="overflow-hidden">
              <div className="border-b border-line bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold">{app.job_title}</h3>
                      {statusBadge(app.status)}
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                      <Building2 size={15} />
                      <span className="font-medium text-ink">{app.employer}</span>
                      <span>•</span>
                      <MapPin size={15} />
                      <span>{app.distance_km.toFixed(1)} km away</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-display text-lg font-bold text-accent">{percent(app.score)}</span>
                    <span className="block text-xs text-muted">Match Score</span>
                  </div>
                </div>

                {/* Progress Status Bar */}
                <div className="mt-4 border-t border-line/60 pt-3">
                  <ApplicationStatusBar status={app.status} hasInterview={Boolean(app.interview_at)} />
                </div>
              </div>

              {/* DYNAMIC STATUS DETAILS: Interview, Hired, or Rejection Feedback */}
              <div className="bg-sunken/40 p-5">
                {/* 1. INTERVIEW SCHEDULED DETAILS */}
                {app.status === "interview_scheduled" && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Calendar size={20} className="mt-0.5 text-amber-500" />
                      <div className="space-y-1">
                        <p className="font-semibold text-ink">Interview Scheduled with {app.employer}</p>
                        <p className="text-sm">
                          <span className="font-medium">Date & Time: </span>
                          <span className="font-bold text-ink">
                            {app.interview_at
                              ? new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(
                                  new Date(app.interview_at),
                                )
                              : "Pending confirmation"}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Interview Format: </span>
                          <span className="capitalize text-ink">
                            {app.interview_mode === "in_person"
                              ? "🏢 In-Person Interview / Shop Floor Practical"
                              : app.interview_mode === "video_call"
                                ? "📹 Online Video Interview"
                                : "📞 Telephonic Interview"}
                          </span>
                        </p>
                        {app.interview_location && (
                          <p className="text-sm">
                            <span className="font-medium">Venue / Link: </span>
                            <span className="text-ink">{app.interview_location}</span>
                          </p>
                        )}
                        {app.interview_notes && (
                          <div className="mt-2 rounded bg-surface p-2.5 text-xs text-muted">
                            <span className="font-semibold text-ink">Employer Instructions: </span>
                            {app.interview_notes}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setWhatsAppPreviewApp(app)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-good/40 bg-good/10 px-2.5 py-1 text-xs font-semibold text-good hover:bg-good hover:text-white transition-colors"
                          >
                            <MessageSquare size={13} />
                            <span>Preview WhatsApp Notification</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. HIRED / SELECTED CELEBRATION */}
                {app.status === "hired" && (
                  <div className="rounded-lg border border-good/40 bg-good/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="mt-0.5 text-good" />
                      <div>
                        <h4 className="font-bold text-good">Congratulations! You have been selected.</h4>
                        <p className="mt-1 text-sm text-ink">
                          {app.employer} has offered you the role of <span className="font-semibold">{app.job_title}</span>.
                        </p>
                        {app.interview_notes && (
                          <p className="mt-1 text-xs text-muted">Note: {app.interview_notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. REJECTED WITH ACTIONABLE FEEDBACK & MISSING SKILLS */}
                {app.status === "rejected" && (
                  <div className="rounded-lg border border-bad/30 bg-bad/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="mt-0.5 text-bad shrink-0" />
                      <div className="space-y-2.5 flex-1">
                        <div>
                          <h4 className="font-semibold text-bad">Recruiter Assessment & Feedback</h4>
                          <p className="text-xs text-muted">
                            Stage: <span className="font-semibold text-ink">{app.interview_at ? "Post-Interview Decision" : "Skill Match Screening"}</span> • Reason:{" "}
                            <span className="font-semibold text-ink capitalize">
                              {app.reject_reason?.replace("_", " ") || "Skills mismatch"}
                            </span>
                          </p>
                        </div>

                        {app.reject_feedback && (
                          <div className="rounded bg-surface p-2.5 text-xs text-ink border border-line/60">
                            <span className="font-medium text-muted">Recruiter Notes: </span>
                            {app.reject_feedback}
                          </div>
                        )}

                        {app.missing_skills && app.missing_skills.length > 0 && (
                          <div>
                            <span className="text-xs text-muted font-medium">Missing skills identified by recruiter:</span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {app.missing_skills.map((s) => (
                                <SkillChip key={s} missing>
                                  {s}
                                </SkillChip>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* REJECTION UPSKILLING & BRIDGE COURSE ENROLLMENT */}
                        <div className="mt-3 rounded-lg border border-line bg-surface p-3.5 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-ink flex items-center gap-1.5">
                                <BookOpen size={14} className="text-accent" /> Recommended ITI Bridging Course:
                              </span>
                              <span className="block text-muted text-[11px]">
                                {getDynamicBridgeCourse(app)}
                              </span>
                              <span className="block text-[10px] text-muted">
                                Sponsored by TNSDC • Government ITI Thuvakudi
                              </span>
                            </div>

                            {enrolledApps.includes(app.application_id) ? (
                              <span className="inline-flex items-center gap-1 rounded bg-good/15 px-3 py-1.5 text-xs font-semibold text-good">
                                <Check size={13} /> Enrolled (Added to Profile)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEnrollBridgeCourse(app)}
                                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-ink hover:bg-accent/90 transition-colors shadow-xs"
                              >
                                Enroll in Bridge Course
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PENDING IN-REVIEW */}
                {app.status === "pending" && (
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Clock size={14} className="text-accent" />
                    <span>Your application is in the employer&#39;s hiring review queue. You will be notified when an interview is scheduled.</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* WHATSAPP NOTIFICATION PREVIEW MODAL */}
      {whatsAppPreviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden">
            {/* WhatsApp Top Bar */}
            <div className="flex items-center justify-between bg-emerald-700 px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                  SB
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight flex items-center gap-1">
                    SkillBridge Official TN
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">✓ Verified</span>
                  </h4>
                  <p className="text-[10px] text-white/80">Automated SMS & WhatsApp Gateway</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppPreviewApp(null)}
                className="rounded-full p-1 text-white/80 hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulated Chat Bubble */}
            <div className="bg-[#e5ddd5] dark:bg-zinc-900 p-4 min-h-[220px] flex flex-col justify-end">
              <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 shadow-xs text-xs text-ink space-y-2 border border-black/5 dark:border-white/5">
                <p className="font-bold text-emerald-700 dark:text-emerald-400">
                  🔔 Interview Invitation Confirmed
                </p>
                <p>
                  Dear <strong className="text-ink">{whatsAppPreviewApp.name}</strong>,
                </p>
                <p className="leading-relaxed">
                  Your application for <strong className="text-ink">{whatsAppPreviewApp.job_title}</strong> at{" "}
                  <strong className="text-ink">{whatsAppPreviewApp.employer}</strong> has been shortlisted!
                </p>
                <div className="rounded bg-sunken/60 p-2 text-[11px] space-y-1">
                  <p>
                    📅 <strong>Date & Time:</strong>{" "}
                    {whatsAppPreviewApp.interview_at
                      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                          new Date(whatsAppPreviewApp.interview_at),
                        )
                      : "Tomorrow at 10:00 AM"}
                  </p>
                  <p>
                    🏢 <strong>Venue:</strong> {whatsAppPreviewApp.interview_location || "Plant Site, Trichy"}
                  </p>
                </div>
                <p className="text-[10px] text-muted italic">
                  Reply &quot;YES&quot; to confirm attendance or contact the recruiter.
                </p>
                <span className="block text-right text-[9px] text-muted">
                  Just now • Delivered via Twilio/WhatsApp API
                </span>
              </div>
            </div>

            <div className="p-3 bg-surface border-t border-line text-center">
              <Button size="sm" variant="secondary" className="w-full text-xs" onClick={() => setWhatsAppPreviewApp(null)}>
                Close WhatsApp Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

