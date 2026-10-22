"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Phone,
  UploadCloud,
  User,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge, Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getStoredCourses, getStoredProfile } from "@/lib/store";
import type { Course, SeekerProfile } from "@/lib/types";

export default function SeekerProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["candidate", "admin"]}>
      <CandidateProfileContent />
    </ProtectedRoute>
  );
}

function CandidateProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SeekerProfile>(getStoredProfile());
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseTab, setActiveCourseTab] = useState<"ongoing" | "completed">("ongoing");

  useEffect(() => {
    const load = () => {
      setProfile(getStoredProfile());
      setCourses(getStoredCourses());
    };
    load();

    window.addEventListener("skillbridge_profile_updated", load);
    window.addEventListener("skillbridge_courses_updated", load);
    window.addEventListener("skillbridge_store_updated", load);
    window.addEventListener("storage", load);

    return () => {
      window.removeEventListener("skillbridge_profile_updated", load);
      window.removeEventListener("skillbridge_courses_updated", load);
      window.removeEventListener("skillbridge_store_updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const ongoingCourses = courses.filter((c) => c.status === "ongoing");
  const completedCourses = courses.filter((c) => c.status === "completed");

  const displayName = profile.name || user?.name || "Arun Kumar";
  const displayQualification = profile.qualification || "ITI Machinist (NCVT)";
  const displayAge = profile.age || 22;
  const displayPhone = profile.phone || user?.phone || "+91 98765 43210";
  const displayTrade = profile.detected_trade || user?.trade || "CNC Operation";
  const displayLocation = profile.location || "Tiruchirappalli, Tamil Nadu";
  const displaySkills =
    profile.skills && profile.skills.length > 0
      ? profile.skills
      : ["Lathe operation", "G-code programming", "Blueprint reading", "Micrometer & Vernier Calipers", "Shopfloor 5S"];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
              <User size={13} />
              Candidate Profile
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-good/15 px-2.5 py-0.5 text-xs font-medium text-good">
              <span className="h-1.5 w-1.5 rounded-full bg-good" />
              Verified NCVT Trainee
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {displayName}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {displayTrade} • {displayLocation}
          </p>
        </div>

        <Link href="/seeker">
          <Button variant="secondary" size="sm" className="gap-2 shrink-0">
            <UploadCloud size={15} className="text-accent" />
            <span>Update CV</span>
          </Button>
        </Link>
      </div>

      {/* 2. PERSONAL DETAILS CARD */}
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-line bg-sunken/40 p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <User size={13} className="text-accent" /> Full Name
            </span>
            <p className="mt-1 text-sm font-semibold text-ink truncate">{displayName}</p>
          </div>

          <div className="rounded-lg border border-line bg-sunken/40 p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <GraduationCap size={13} className="text-accent" /> Qualification
            </span>
            <p className="mt-1 text-sm font-semibold text-ink truncate" title={displayQualification}>
              {displayQualification}
            </p>
          </div>

          <div className="rounded-lg border border-line bg-sunken/40 p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Calendar size={13} className="text-accent" /> Age
            </span>
            <p className="mt-1 text-sm font-semibold text-ink">{displayAge} Years</p>
          </div>

          <div className="rounded-lg border border-line bg-sunken/40 p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Phone size={13} className="text-accent" /> Phone
            </span>
            <p className="mt-1 text-sm font-semibold text-ink">{displayPhone}</p>
          </div>
        </div>
      </Card>

      {/* 3. SKILLS CARD (NEAT, UNWANTED TEXT REMOVED) */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <h3 className="font-display text-base font-bold text-ink">Skills</h3>
          <span className="text-xs text-muted">
            Trade: <strong className="text-ink font-semibold">{displayTrade}</strong>
          </span>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {displaySkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-sunken/40 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/40"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {skill}
            </span>
          ))}
        </div>
      </Card>

      {/* 4. COURSES CARD (INTERACTIVE CLICK: ONGOING VS COMPLETED) */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between border-b border-line px-5 py-3.5 gap-2 bg-sunken/20">
          <h3 className="font-display text-base font-bold text-ink">Courses</h3>

          {/* TOGGLE TABS */}
          <div className="flex rounded-lg border border-line bg-surface p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveCourseTab("ongoing")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeCourseTab === "ongoing"
                  ? "bg-accent text-accent-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Clock size={13} />
              <span>Ongoing Courses</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeCourseTab === "ongoing" ? "bg-white/20 text-white" : "bg-sunken text-muted"
                }`}
              >
                {ongoingCourses.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCourseTab("completed")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeCourseTab === "completed"
                  ? "bg-good text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Completed Courses</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeCourseTab === "completed" ? "bg-white/20 text-white" : "bg-sunken text-muted"
                }`}
              >
                {completedCourses.length}
              </span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* ONGOING COURSES VIEW */}
          {activeCourseTab === "ongoing" && (
            <div className="space-y-3">
              {ongoingCourses.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">No ongoing courses.</p>
              ) : (
                ongoingCourses.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-line bg-surface p-4 transition-all hover:border-accent/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm text-ink">{c.title}</h4>
                        <p className="text-xs text-muted mt-0.5">{c.provider}</p>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                        <Clock size={12} />
                        {c.progressPct}% Complete
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-muted">
                        <span>Modules: {c.modulesDone} of {c.modulesTotal} completed</span>
                        <span>Duration: {c.duration}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${c.progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* COMPLETED COURSES VIEW */}
          {activeCourseTab === "completed" && (
            <div className="space-y-3">
              {completedCourses.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">No completed courses yet.</p>
              ) : (
                completedCourses.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-line bg-surface p-4 transition-all hover:border-good/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-ink">{c.title}</h4>
                          <span className="inline-flex items-center gap-1 rounded-full bg-good/15 px-2 py-0.5 text-[10px] font-semibold text-good">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{c.provider}</p>
                      </div>

                      <Badge tone="good" className="text-xs">
                        Completed {c.completedDate}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2.5 text-xs text-muted">
                      <span>Credential ID: <strong className="font-mono text-ink">{c.certificateId}</strong></span>
                      <span className="font-medium text-good flex items-center gap-1">
                        <Award size={13} /> {c.badge || "Accredited Certificate"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
