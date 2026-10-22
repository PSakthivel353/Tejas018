"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { Badge, Card, SkillChip } from "@/components/ui";
import type { SeekerProfile } from "@/lib/types";
import { percent } from "@/lib/utils";

export function ExtractedSkillsBanner({ profile }: { profile: SeekerProfile }) {
  return (
    <Card className="border-accent/40 bg-accent-soft/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-ink">
            <Sparkles size={16} />
          </span>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">SkillBridge Intelligence</span>
            <h3 className="font-display text-lg font-bold">Skills & Trade Profile Analysis</h3>
          </div>
        </div>
        <Badge tone="good" className="px-3 py-1 text-xs">
          <CheckCircle2 size={13} /> {percent(profile.confidence)} Analysis Confidence
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Trade we found</span>
          <p className="mt-0.5 font-display text-xl font-bold text-accent">{profile.detected_trade}</p>
          <p className="mt-1 text-xs text-muted">
            Candidate: <span className="font-semibold text-ink">{profile.name}</span>
          </p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Skills we extracted</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <SkillChip key={skill}>{skill}</SkillChip>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Showing live vacancies in the district ranked by compatibility with these verified skills.
      </p>
    </Card>
  );
}

