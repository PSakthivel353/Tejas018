"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  PenTool,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { CvUploader } from "@/components/seeker/CvUploader";
import { ExtractedSkillsBanner } from "@/components/seeker/ExtractedSkillsBanner";
import { JobMatches } from "@/components/seeker/JobMatches";
import { ManualProfileForm } from "@/components/seeker/ManualProfileForm";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge, Button, Card, Notice, PageHeader, ProgressBar, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { DISTRICT_LAT, DISTRICT_LON, matchJobs, uploadCv } from "@/lib/api";
import { getApplicationsForSeeker, getStoredJobs, saveStoredProfile, storeApplyToJob } from "@/lib/store";
import type { Candidate, JobMatch, SeekerProfile } from "@/lib/types";
import { cn, errorMessage } from "@/lib/utils";

type InputMode = "upload" | "manual";

export default function SeekerPage() {
  return (
    <ProtectedRoute allowedRoles={["candidate", "admin"]}>
      <SeekerContent />
    </ProtectedRoute>
  );
}

function SeekerContent() {
  const { user } = useAuth();
  const [mode, setMode] = useState<InputMode>("upload");

  const [uploadPct, setUploadPct] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile starts strictly as NULL until CV is uploaded or form is submitted
  const [profile, setProfile] = useState<SeekerProfile | null>(null);

  const [radius, setRadius] = useState(40);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [applications, setApplications] = useState<Candidate[]>([]);
  const [applyNotice, setApplyNotice] = useState<{ jobTitle: string; employer: string } | null>(null);

  const seekerId = profile?.seeker_id || user?.seeker_id || 101;

  // Sync applications from shared store
  const refreshApps = useCallback(() => {
    setApplications(getApplicationsForSeeker(seekerId));
  }, [seekerId]);

  useEffect(() => {
    refreshApps();
    window.addEventListener("skillbridge_store_updated", refreshApps);
    window.addEventListener("storage", refreshApps);
    return () => {
      window.removeEventListener("skillbridge_store_updated", refreshApps);
      window.removeEventListener("storage", refreshApps);
    };
  }, [refreshApps]);

  // Load matching jobs when profile exists
  const loadMatches = useCallback(
    async (prof: SeekerProfile, radiusKm: number) => {
      setLoadingJobs(true);
      try {
        const matches = await matchJobs({
          trade_id: prof.trade_id,
          skills: prof.skills,
          lat: DISTRICT_LAT,
          lon: DISTRICT_LON,
          radius_km: radiusKm,
        });

        // Merge with freshly posted employer vacancies from store
        const stored = getStoredJobs().filter((j: JobMatch) => j.distance_km <= radiusKm);
        const combined = [...matches];
        stored.forEach((sj: JobMatch) => {
          if (!combined.some((cj: JobMatch) => cj.vacancy_id === sj.vacancy_id)) {
            combined.unshift(sj);
          }
        });

        setJobs(combined);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoadingJobs(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (profile) {
      void loadMatches(profile, radius);
    }
  }, [profile, radius, loadMatches]);

  // Handle PDF upload & extraction
  async function handleFileUpload(file: File) {
    setError(null);
    setProfile(null);
    setJobs([]);
    setFileName(file.name);
    setUploadPct(0);
    setBusy(true);

    try {
      const parsedProfile = await uploadCv(file, setUploadPct);
      const finalProfile: SeekerProfile = {
        ...parsedProfile,
        seeker_id: user?.seeker_id || parsedProfile.seeker_id,
        name: user?.name || parsedProfile.name,
      };
      setProfile(finalProfile);
      saveStoredProfile(finalProfile);
      await loadMatches(finalProfile, radius);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  // Handle manual profile form submission
  function handleManualProfile(newProfile: SeekerProfile) {
    setError(null);
    setProfile(newProfile);
    saveStoredProfile(newProfile);
    void loadMatches(newProfile, radius);
  }

  // Reset/Re-upload
  function handleReset() {
    setProfile(null);
    setFileName(null);
    setJobs([]);
    setUploadPct(0);
  }

  // Apply to a job vacancy
  async function handleApply(job: JobMatch) {
    if (!profile) return;
    storeApplyToJob(profile, job);
    refreshApps();
    setApplyNotice({ jobTitle: job.title, employer: job.employer });
    setTimeout(() => {
      setApplyNotice((prev) => (prev?.jobTitle === job.title ? null : prev));
    }, 6000);
  }

  const appliedCount = applications.length;

  return (
    <div className="space-y-10 pb-12">
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Candidate Career Portal</h1>
          <p className="mt-1 text-sm text-muted">
            Upload your CV to automatically extract technical competencies and match with live verified district vacancies.
          </p>
        </div>

        <Link href="/seeker/applications">
          <Button variant="secondary" className="gap-2 border-accent/40 bg-accent-soft text-accent">
            <span>View Applied Jobs ({appliedCount})</span>
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      {error && <Notice kind="error">{error}</Notice>}

      {/* 2. TOP SECTION: UPLOADER & PROFILE INPUT (CENTERED & NEAT) */}
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="overflow-hidden shadow-sm">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-line bg-sunken">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors",
                mode === "upload"
                  ? "border-b-2 border-accent bg-surface text-accent"
                  : "text-muted hover:text-ink",
              )}
            >
              <FileText size={16} /> Upload CV (PDF)
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors",
                mode === "manual"
                  ? "border-b-2 border-accent bg-surface text-accent"
                  : "text-muted hover:text-ink",
              )}
            >
              <PenTool size={16} /> Fill Manually
            </button>
          </div>

          <div className="p-6">
            {mode === "upload" ? (
              <div className="space-y-4">
                <CvUploader busy={busy} fileName={fileName} onFile={handleFileUpload} />

                {/* Progress bar during extraction */}
                {busy && (
                  <div className="space-y-2 rounded-lg border border-accent/20 bg-accent-soft/30 p-3 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-accent">
                        <Loader2 size={14} className="animate-spin" />
                        Analyzing trade competencies & matching jobs...
                      </span>
                      <span className="font-bold text-accent">{uploadPct}%</span>
                    </div>
                    <ProgressBar value={uploadPct} label="CV Extraction Progress" />
                  </div>
                )}

                {/* Analysis Success Confirmation Pill */}
                {profile && !busy && (
                  <div className="flex items-center justify-between rounded-lg border border-good/40 bg-good/10 px-4 py-2.5 text-xs text-good">
                    <span className="flex items-center gap-2 font-semibold">
                      <FileCheck2 size={16} />
                      Verified Profile: {profile.detected_trade} • {profile.skills.length} Technical Skills Extracted
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex items-center gap-1 font-semibold underline hover:text-good/80"
                    >
                      <RotateCcw size={12} /> Upload Another CV
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ManualProfileForm
                initialName={user?.name}
                initialTrade={user?.trade || "CNC Operation"}
                onProfileCreated={handleManualProfile}
              />
            )}
          </div>
        </Card>

        {/* 3. SKILLS ANALYSIS BANNER (APPEARS DIRECTLY BELOW UPLOADER ONCE ANALYZED) */}
        {profile && <ExtractedSkillsBanner profile={profile} />}
      </div>

      {/* 4. BELOW SECTION: UNIFORM JOB OPENINGS GRID (ONLY APPEARS AFTER ANALYZING OR WHILE BUSY) */}
      {(profile || busy) && (
        <div className="space-y-6 pt-4">
          {/* APPLIED SUCCESS TRIGGER NOTICE */}
          {applyNotice && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-good/40 bg-good/10 p-3.5 text-xs text-ink shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-good shrink-0" />
                <div>
                  <span className="font-bold text-good">Applied successfully!</span>{" "}
                  <span className="text-muted">
                    Application for <strong className="text-ink">{applyNotice.jobTitle}</strong> at {applyNotice.employer} submitted.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/seeker/applications"
                  className="font-semibold text-accent hover:underline flex items-center gap-1"
                >
                  <span>View status in Applied Jobs</span>
                  <ArrowRight size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => setApplyNotice(null)}
                  className="text-muted hover:text-ink p-1 rounded-full transition-colors"
                  aria-label="Dismiss notice"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Section Header with Count & Radius Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-ink">
                <Briefcase size={16} />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">Recommended Openings</h2>
                <p className="text-xs text-muted">
                  {profile
                    ? `Displaying verified openings matching ${profile.detected_trade} within ${radius} km`
                    : "Analyzing your profile..."}
                </p>
              </div>
            </div>

            {/* Radius Selector */}
            <div className="flex items-center gap-2" role="group" aria-label="Distance radius">
              <span className="text-xs font-medium text-muted">Search Radius:</span>
              {[20, 40, 80].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={radius === r}
                  onClick={() => setRadius(r)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all",
                    radius === r
                      ? "bg-accent font-semibold text-accent-ink shadow-sm"
                      : "border border-line bg-surface text-muted hover:border-accent hover:text-ink",
                  )}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic State Rendering */}
          {busy ? (
            /* Analyzing Placeholder */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="space-y-3 p-6">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-full rounded" />
                </Card>
              ))}
            </div>
          ) : (
            /* Verified Matches Grid with Uniform Hover Cards */
            <JobMatches
              jobs={jobs}
              loading={loadingJobs}
              radius={radius}
              profile={profile}
              applications={applications}
              onApply={handleApply}
            />
          )}
        </div>
      )}


    </div>
  );
}
