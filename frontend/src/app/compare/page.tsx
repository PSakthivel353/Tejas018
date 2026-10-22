"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  RotateCcw,
  Sparkles,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { RejectFeedbackModal } from "@/components/employer/RejectFeedbackModal";
import { ScheduleInterviewModal } from "@/components/employer/ScheduleInterviewModal";
import { Badge, Button, Card, Notice, PageHeader, SkillChip } from "@/components/ui";
import {
  getApplicationsForEmployer,
  getApplicationsForSeeker,
  saveStoredApplications,
  storeRejectCandidate,
  storeScheduleInterview,
  storeSelectCandidate,
} from "@/lib/store";
import type { Candidate, InterviewDetails, RejectReason } from "@/lib/types";
import { cn, percent } from "@/lib/utils";

export default function ComparePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [rejectCandidate, setRejectCandidate] = useState<Candidate | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const loadData = () => {
    setCandidates(getApplicationsForEmployer(1));
  };

  useEffect(() => {
    loadData();
    window.addEventListener("skillbridge_store_updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("skillbridge_store_updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  // Candidate: Arun Kumar (ID: 101)
  const candidateApps = candidates.filter((c) => c.seeker_id === 101);

  // Employer Actions
  const handleScheduleSubmit = (details: InterviewDetails) => {
    if (!interviewCandidate) return;
    storeScheduleInterview(interviewCandidate.application_id, details);
    setInterviewCandidate(null);
    setSyncNotice(`⚡ SIMULTANEOUS UPDATE: Interview set. Candidate profile updated instantly.`);
    setTimeout(() => setSyncNotice(null), 5000);
  };

  const handleSelect = (candidate: Candidate) => {
    storeSelectCandidate(candidate.application_id, "Selected after shopfloor assessment.");
    setSyncNotice(`⚡ SIMULTANEOUS UPDATE: ${candidate.name} selected. Candidate received offer notification.`);
    setTimeout(() => setSyncNotice(null), 5000);
  };

  const handleRejectSubmit = (reason: RejectReason, feedback: string, missingSkill: string) => {
    if (!rejectCandidate) return;
    storeRejectCandidate(rejectCandidate.application_id, reason, feedback, missingSkill);
    setRejectCandidate(null);
    setSyncNotice(`⚡ SIMULTANEOUS UPDATE: Application rejected. Constructive feedback delivered to candidate.`);
    setTimeout(() => setSyncNotice(null), 5000);
  };

  const handleResetDemo = () => {
    localStorage.removeItem("skillbridge_shared_applications");
    window.dispatchEvent(new Event("skillbridge_store_updated"));
    setSyncNotice("Demo data restored to initial state.");
    setTimeout(() => setSyncNotice(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
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

      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="signal" className="px-2.5 py-0.5 text-xs font-bold">
              Dual Live View
            </Badge>
            <h1 className="font-display text-2xl font-bold">Real-Time Synchronization Comparator</h1>
          </div>
          <p className="mt-1 text-xs text-muted">
            Make decisions on the Employer side (right) and watch the Candidate profile (left) update simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleResetDemo} className="gap-1.5 text-xs">
            <RotateCcw size={13} /> Reset Demo Data
          </Button>
          <Link href="/">
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
              <ArrowLeft size={13} /> Back
            </Button>
          </Link>
        </div>
      </div>

      {syncNotice && (
        <div className="animate-bounce">
          <Notice kind="success">{syncNotice}</Notice>
        </div>
      )}

      {/* DUAL SPLIT-SCREEN GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ============================================================== */}
        {/* LEFT PANEL: CANDIDATE PERSPECTIVE (Arun Kumar)               */}
        {/* ============================================================== */}
        <div className="space-y-4 rounded-xl border border-accent/40 bg-accent-soft/10 p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-ink">
                <GraduationCap size={16} />
              </span>
              <div>
                <h2 className="font-display text-base font-bold">Candidate Perspective</h2>
                <p className="text-xs text-muted">Arun Kumar (cand101) • CNC Operation</p>
              </div>
            </div>
            <Badge tone="accent">Live Candidate Screen</Badge>
          </div>

          <p className="text-xs font-medium text-muted">
            Watching for employer decisions in real-time:
          </p>

          <div className="space-y-4">
            {candidateApps.map((app) => (
              <Card key={app.application_id} className="overflow-hidden border-line">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">{app.job_title}</h3>
                      <p className="text-xs text-muted">{app.employer}</p>
                    </div>
                    <Badge
                      tone={
                        app.status === "hired"
                          ? "good"
                          : app.status === "interview_scheduled"
                            ? "signal"
                            : app.status === "rejected"
                              ? "bad"
                              : "accent"
                      }
                      className="text-[10px] capitalize"
                    >
                      {app.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Multi-step Status Tracker */}
                  <div className="mt-3 rounded bg-sunken p-2.5">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-good">1. Applied ✓</span>
                      <span className={app.status !== "pending" ? "text-good" : "text-accent font-bold"}>
                        2. Review
                      </span>
                      <span
                        className={
                          app.status === "interview_scheduled"
                            ? "font-bold text-amber-500"
                            : app.status === "hired"
                              ? "text-good"
                              : "text-muted"
                        }
                      >
                        3. Interview
                      </span>
                      <span
                        className={
                          app.status === "hired"
                            ? "font-bold text-good"
                            : app.status === "rejected"
                              ? "font-bold text-bad"
                              : "text-muted"
                        }
                      >
                        4. {app.status === "rejected" ? "Rejected" : "Hired"}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Dynamic Feedback Box */}
                  <div className="mt-3">
                    {app.status === "interview_scheduled" && (
                      <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          📅 Interview Scheduled!
                        </p>
                        <p className="mt-1 text-ink">
                          {app.interview_at
                            ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                                new Date(app.interview_at),
                              )
                            : "Time confirmed"}
                        </p>
                        <p className="text-muted">Venue/Link: {app.interview_location}</p>
                        {app.interview_notes && <p className="mt-1 text-muted">Notes: {app.interview_notes}</p>}
                      </div>
                    )}

                    {app.status === "hired" && (
                      <div className="rounded border border-good/40 bg-good/10 p-3 text-xs text-good font-semibold">
                        🎉 Congratulations! You have been selected for this position.
                      </div>
                    )}

                    {app.status === "rejected" && (
                      <div className="rounded border border-bad/30 bg-bad/10 p-3 text-xs">
                        <p className="font-bold text-bad">
                          Feedback: {app.reject_reason?.replace("_", " ")}
                        </p>
                        {app.reject_feedback && <p className="mt-1 text-ink">{app.reject_feedback}</p>}
                        {app.bridge_course && (
                          <p className="mt-1 font-medium text-muted">Suggested course: {app.bridge_course}</p>
                        )}
                      </div>
                    )}

                    {app.status === "pending" && (
                      <p className="text-xs text-muted">Waiting for recruiter to review application...</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANEL: EMPLOYER PERSPECTIVE (Kaveri Precision Works)     */}
        {/* ============================================================== */}
        <div className="space-y-4 rounded-xl border border-good/40 bg-good/5 p-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-good text-good-ink">
                <Building2 size={16} />
              </span>
              <div>
                <h2 className="font-display text-base font-bold">Employer Perspective</h2>
                <p className="text-xs text-muted">Kaveri Precision Works (rec201) • Recruiter</p>
              </div>
            </div>
            <Badge tone="good">Interactive Recruiter Console</Badge>
          </div>

          <p className="text-xs font-medium text-muted">
            Click an action below to test simultaneous updates:
          </p>

          <div className="space-y-4">
            {candidates.map((c) => (
              <Card key={c.application_id} className="overflow-hidden border-line">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">{c.name}</h3>
                      <p className="text-xs text-muted">
                        Applied for: <span className="font-semibold text-ink">{c.job_title}</span>
                      </p>
                    </div>
                    <Badge
                      tone={
                        c.status === "hired"
                          ? "good"
                          : c.status === "interview_scheduled"
                            ? "signal"
                            : c.status === "rejected"
                              ? "bad"
                              : "accent"
                      }
                      className="text-[10px] capitalize"
                    >
                      {c.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Skills tags */}
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {c.skills.slice(0, 3).map((s) => (
                      <SkillChip key={s}>{s}</SkillChip>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-line/60 pt-3">
                    {c.status !== "hired" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={() => setInterviewCandidate(c)}
                      >
                        <Calendar size={12} className="mr-1 text-accent" />
                        {c.status === "interview_scheduled" ? "Reschedule" : "Schedule Interview"}
                      </Button>
                    )}

                    {c.status !== "hired" && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="h-7 text-xs bg-good hover:bg-good/90"
                        onClick={() => handleSelect(c)}
                      >
                        <UserCheck size={12} className="mr-1" /> Select
                      </Button>
                    )}

                    {c.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs text-bad hover:bg-bad/10"
                        onClick={() => setRejectCandidate(c)}
                      >
                        <UserX size={12} className="mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

