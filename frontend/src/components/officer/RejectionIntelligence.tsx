"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Lightbulb, TrendingUp, CheckCircle } from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui";
import { getStoredApplications } from "@/lib/store";
import type { Candidate } from "@/lib/types";

export function RejectionIntelligence() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    const load = () => setCandidates(getStoredApplications());
    load();
    window.addEventListener("skillbridge_store_updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("skillbridge_store_updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const rejected = candidates.filter((c) => c.status === "rejected");

  // Baseline simulated stats + live rejected candidates
  const baseReasons: Record<string, number> = {
    skills_mismatch: 6,
    experience: 3,
    salary_expectation: 1,
    too_far: 1,
  };

  const reasonCounts: Record<string, number> = { ...baseReasons };
  rejected.forEach((c) => {
    const r = c.reject_reason || "skills_mismatch";
    reasonCounts[r] = (reasonCounts[r] || 0) + 1;
  });

  const totalRejectedCount = Object.values(reasonCounts).reduce((a, b) => a + b, 0);

  // Top missing skills reported by recruiters
  const skillCounts: Record<string, number> = {
    "Tool offset setting": 5,
    "G-code programming": 4,
    "Blueprint reading": 3,
    "Micrometer calibration": 2,
  };

  rejected.forEach((c) => {
    c.missing_skills?.forEach((s) => {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    });
  });

  const sortedSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const reasonLabels: Record<string, string> = {
    skills_mismatch: "Technical Skills Deficit",
    experience: "Lack of Practical Shopfloor Hours",
    salary_expectation: "Wage Expectation Gap",
    too_far: "Commute / Distance Constraint",
    other: "Other Interview Factors",
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader
          title="Recruiter Rejection Diagnostics"
          description="Real-time feedback when employers turn down candidates. Identifies practical curriculum gaps."
          action={
            <Badge tone="warn" className="text-xs">
              Live Feedback ({totalRejectedCount} cases)
            </Badge>
          }
        />
        
        <div className="space-y-6 p-5">
          {/* REASONS BREAKDOWN */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <AlertTriangle size={15} className="text-bad" />
              Primary Rejection Causes
            </h4>
            <div className="space-y-2.5">
              {Object.entries(reasonCounts).map(([key, count]) => {
                const pct = Math.round((count / totalRejectedCount) * 100);
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-ink">{reasonLabels[key] || key}</span>
                      <span className="tabular-nums text-muted font-medium">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-sunken">
                      <div
                        className="h-full rounded-full bg-bad transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOP REPORTED MISSING SKILLS */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <TrendingUp size={15} className="text-accent" />
              Top Missing Skills Cited by Recruiters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sortedSkills.map(([skill, count]) => (
                <div
                  key={skill}
                  className="flex items-center justify-between rounded-md border border-line bg-sunken/40 px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-ink truncate mr-2">{skill}</span>
                  <Badge tone="warn" className="shrink-0 text-[11px]">
                    {count} citations
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* POLICY ADVISORY NOTICE */}
      <div className="border-t border-line bg-accent-soft/30 p-4 rounded-b-lg">
        <div className="flex items-start gap-3">
          <Lightbulb size={18} className="mt-0.5 text-accent shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-accent">Policy Action Recommended for District ITI Council: </span>
            <span>
              Direct Government ITI Thuvakudi and ITI Trichy to introduce a mandatory 3-week module in{" "}
              <span className="font-semibold text-ink">Tool Offset Setting</span> and practical G-code troubleshooting.
              Over 60% of technical rejections in the district cite this exact competency.
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
