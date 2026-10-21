"use client";

import { Check, Circle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CvUploader } from "./CvUploader";
import { ApplicationUpdates } from "./ApplicationUpdates";
import { JobMatches } from "./JobMatches";
import { Badge, Card, CardHeader, Notice, ProgressBar, SkillChip, inputClass } from "@/components/ui";
import { applyToJob, DISTRICT_LAT, DISTRICT_LON, getSeekerApplications, matchJobs, uploadCv } from "@/lib/api";
import type { Candidate, JobMatch, SeekerProfile } from "@/lib/types";
import { cn, errorMessage, percent } from "@/lib/utils";

type Stage = "idle" | "uploading" | "matching" | "done" | "error";

const RADII = [20, 40, 80];

export function SeekerPortal() {
  const [stage, setStage] = useState<Stage>("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [profile, setProfile] = useState<SeekerProfile | null>(null);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [applications, setApplications] = useState<Candidate[]>([]);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [radius, setRadius] = useState(40);
  const [rematching, setRematching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = useCallback(
    (p: SeekerProfile, radius_km: number) =>
      matchJobs({ trade_id: p.trade_id, skills: p.skills, lat: DISTRICT_LAT, lon: DISTRICT_LON, radius_km }),
    [],
  );

  const refreshApplications = useCallback(async (seekerId: number) => {
    try {
      setApplications(await getSeekerApplications(seekerId));
      setApplicationsError(null);
    } catch (e) {
      setApplicationsError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    let saved: string | null;
    try {
      saved = window.sessionStorage.getItem("skillbridge.seekerProfile");
    } catch (e) {
      setApplicationsError(`Could not restore your saved profile. ${errorMessage(e)}`);
      return;
    }
    if (!saved) return;
    let restored: SeekerProfile;
    try {
      restored = JSON.parse(saved) as SeekerProfile;
      if (!Number.isFinite(restored.seeker_id) || !Array.isArray(restored.skills)) {
        throw new Error("Saved profile is incomplete. Upload your CV again.");
      }
    } catch (e) {
      setError(errorMessage(e));
      setStage("error");
      return;
    }

    setProfile(restored);
    setStage("matching");
    Promise.allSettled([find(restored, radius), getSeekerApplications(restored.seeker_id)])
      .then(([matchesResult, applicationsResult]) => {
        if (applicationsResult.status === "fulfilled") {
          setApplications(applicationsResult.value);
          setApplicationsError(null);
        } else {
          setApplicationsError(errorMessage(applicationsResult.reason));
        }
        if (matchesResult.status === "rejected") {
          throw matchesResult.reason;
        }
        setJobs(matchesResult.value);
        setStage("done");
      })
      .catch((e: unknown) => {
        setError(errorMessage(e));
        setStage("error");
      });
  }, [find, radius]);

  useEffect(() => {
    if (!profile) return;
    const timer = window.setInterval(() => void refreshApplications(profile.seeker_id), 15000);
    return () => window.clearInterval(timer);
  }, [profile, refreshApplications]);

  async function handleFile(file: File) {
    setError(null);
    setProfile(null);
    setJobs([]);
    setApplications([]);
    setApplicationsError(null);
    setFileName(file.name);
    setUploadPct(0);
    setStage("uploading");
    try {
      window.sessionStorage.removeItem("skillbridge.seekerProfile");
    } catch {
      setApplicationsError("The previous profile could not be cleared from this browser session.");
    }
    try {
      const p = await uploadCv(file, setUploadPct);
      setProfile(p);
      let profileSaveError: string | null = null;
      try {
        window.sessionStorage.setItem("skillbridge.seekerProfile", JSON.stringify(p));
      } catch {
        profileSaveError = "Your profile could not be saved for this browser session. Upload your CV again if you leave this page.";
      }
      setStage("matching");
      setJobs(await find(p, radius));
      await refreshApplications(p.seeker_id);
      if (profileSaveError) setApplicationsError(profileSaveError);
      setStage("done");
    } catch (e) {
      setError(errorMessage(e));
      setStage("error");
    }
  }

  async function apply(job: JobMatch) {
    if (!profile) return;
    const application = await applyToJob(profile, job);
    setApplications((current) => [
      ...current.filter((item) => item.application_id !== application.application_id),
      application,
    ]);
  }

  async function changeRadius(next: number) {
    setRadius(next);
    if (!profile) return;
    setRematching(true);
    try {
      setJobs(await find(profile, next));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRematching(false);
    }
  }

  // One bar for the whole journey: upload = 0 to 60, reading the CV = 60 to 80, matching = 80 to 100
  const uploadDone = uploadPct >= 100;
  const overall =
    stage === "uploading" ? (uploadDone ? 70 : uploadPct * 0.6) : stage === "matching" ? 85 : stage === "done" ? 100 : 0;
  const busy = stage === "uploading" || stage === "matching";

  const steps = [
    { label: "CV uploaded", done: stage === "matching" || stage === "done" || (stage === "uploading" && uploadDone) },
    { label: "Skills found", done: stage === "matching" || stage === "done" },
    { label: "Jobs matched", done: stage === "done" },
  ];

  const statusText =
    stage === "uploading"
      ? uploadDone
        ? "Reading your CV"
        : `Uploading ${Math.round(uploadPct)}%`
      : stage === "matching"
        ? "Finding jobs near you"
        : stage === "done"
          ? "Your matches are ready"
          : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Your CV" description="We read your trade and skills from the PDF. Nothing else is needed." />
          <div className="p-5">
            <CvUploader busy={busy} fileName={fileName} onFile={handleFile} />
          </div>
        </Card>

        {stage !== "idle" && (
          <Card>
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium" aria-live="polite">
                  {statusText || "Something went wrong"}
                </p>
                <span className="text-sm tabular-nums text-muted">{Math.round(overall)}%</span>
              </div>
              <ProgressBar value={overall} label="Profile progress" />
              <ul className="space-y-2">
                {steps.map((s) => (
                  <li key={s.label} className={cn("flex items-center gap-2 text-sm", s.done ? "text-ink" : "text-muted")}>
                    {s.done ? <Check size={16} className="text-good" aria-hidden /> : <Circle size={16} aria-hidden />}
                    {s.label}
                  </li>
                ))}
              </ul>
              {error && <Notice kind="error">{error}</Notice>}
            </div>
          </Card>
        )}

        {profile && (
          <Card>
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">Trade we found</p>
                  <p className="font-display text-xl font-semibold">{profile.detected_trade}</p>
                </div>
                <Badge tone={profile.confidence >= 0.6 ? "good" : "warn"}>{percent(profile.confidence)} sure</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <SkillChip key={s}>{s}</SkillChip>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-6 self-start">
        <Card>
          <CardHeader
            title="Jobs near you"
            description="Ranked by how well your skills fit and how close the job is."
            action={
              <div className="shrink-0">
                <label htmlFor="radius" className="sr-only">
                  Distance
                </label>
                <select
                  id="radius"
                  value={radius}
                  onChange={(e) => changeRadius(Number(e.target.value))}
                  disabled={busy || rematching}
                  className={cn(inputClass, "w-auto py-1.5")}
                >
                  {RADII.map((r) => (
                    <option key={r} value={r}>
                      Within {r} km
                    </option>
                  ))}
                </select>
              </div>
            }
          />
          {stage === "idle" ? (
            <p className="px-5 py-10 text-center text-sm text-muted">Upload your CV to see openings that fit your trade.</p>
          ) : stage === "error" ? (
            <p className="px-5 py-10 text-center text-sm text-muted">Fix the problem on the left, then upload again.</p>
          ) : (
            <>
              {applicationsError && (
                <div className="px-5 pt-4">
                  <Notice kind="error">{applicationsError}</Notice>
                </div>
              )}
              <JobMatches
                jobs={jobs}
                loading={stage === "uploading" || stage === "matching" || rematching}
                radius={radius}
                profile={profile}
                applications={applications}
                onApply={apply}
              />
            </>
          )}
        </Card>
        <ApplicationUpdates applications={applications} />
      </div>
    </div>
  );
}
