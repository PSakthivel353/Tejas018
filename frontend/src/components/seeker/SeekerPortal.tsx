"use client";

import { Check, Circle } from "lucide-react";
import { useState } from "react";
import { CvUploader } from "./CvUploader";
import { JobMatches } from "./JobMatches";
import { Badge, Card, CardHeader, Notice, ProgressBar, SkillChip, inputClass } from "@/components/ui";
import { DISTRICT_LAT, DISTRICT_LON, matchJobs, uploadCv } from "@/lib/api";
import type { JobMatch, SeekerProfile } from "@/lib/types";
import { cn, errorMessage, percent } from "@/lib/utils";

type Stage = "idle" | "uploading" | "matching" | "done" | "error";

const RADII = [20, 40, 80];

export function SeekerPortal() {
  const [stage, setStage] = useState<Stage>("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [profile, setProfile] = useState<SeekerProfile | null>(null);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [radius, setRadius] = useState(40);
  const [rematching, setRematching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = (p: SeekerProfile, radius_km: number) =>
    matchJobs({ trade_id: p.trade_id, skills: p.skills, lat: DISTRICT_LAT, lon: DISTRICT_LON, radius_km });

  async function handleFile(file: File) {
    setError(null);
    setProfile(null);
    setJobs([]);
    setFileName(file.name);
    setUploadPct(0);
    setStage("uploading");
    try {
      const p = await uploadCv(file, setUploadPct);
      setProfile(p);
      setStage("matching");
      setJobs(await find(p, radius));
      setStage("done");
    } catch (e) {
      setError(errorMessage(e));
      setStage("error");
    }
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

      <Card className="self-start">
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
          <JobMatches jobs={jobs} loading={stage === "uploading" || stage === "matching" || rematching} radius={radius} />
        )}
      </Card>
    </div>
  );
}
